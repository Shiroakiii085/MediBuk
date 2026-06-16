import { NextResponse } from 'next/server';
import { readCSV } from '@/lib/githubDb';

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1/chat/completions';

// Build system prompt with CSV context
async function buildSystemPrompt(): Promise<string> {
  const [clinics, doctors, symptoms] = await Promise.all([
    readCSV<any>('clinics.csv'),
    readCSV<any>('doctors.csv'),
    readCSV<any>('symptoms.csv'),
  ]);

  const clinicList = clinics.map((c: any) => 
    `- ${c.name}: ${c.address} | Chuyên khoa: ${c.specialties}`
  ).join('\n');

  const doctorList = doctors.map((d: any) => {
    const clinic = clinics.find((c: any) => c.clinic_id.toString() === d.clinic_id.toString());
    return `- ${d.name} (${d.specialty}) tại ${clinic?.name || 'N/A'} | Triệu chứng: ${d.symptoms_handled} | Giờ: ${d.work_hours}`;
  }).join('\n');

  const symptomList = symptoms.map((s: any) => 
    `- ${s.name} (${s.severity}): ${s.description}`
  ).join('\n');

  return `Bạn là trợ lý AI thông minh của hệ thống MediBuk. Bạn có thể trả lời bất kỳ câu hỏi nào, ngoại trừ những nội dung vi phạm đạo đức và pháp luật.

Bạn có kiến thức về:
' Y tế và sức khỏe (triệu chứng, bệnh viện, bác sĩ)
' Công nghệ, lập trình, khoa học
' Lịch sử, văn hóa, xã hội
' Giáo dục, học tập
' Và nhiều lĩnh vực khác

Đặc biệt, bạn có thông tin từ dữ liệu MediBuk về 25 bệnh viện tại Hà Nội, 52 bác sĩ, và 50 triệu chứng y tế.

KHI NGƯỜI DÙNG HỎI VỀ Y TẾ:
' Cung cấp thông tin từ dữ liệu MediBuk (bệnh viện, bác sĩ, triệu chứng)
' Gợi ý chuyên khoa phù hợp
' Lưu ý: Đây chỉ là tư vấn sơ bộ, cần đến bệnh viện khám trực tiếp

KHI NGƯỜI DÙNG HỎI VỀ MEDIBUK:
' Hướng dẫn cách đặt lịch khám, xem lịch hẹn, quản lý tài khoản
' Quy trình 4 bước: Nhập địa chỉ, Chọn bệnh viện, Nhập triệu chứng, Chọn ngày giờ

TỐI ƯU TỐC ĐỘ:
' Trả lời ngắn gọn, súc tích
' Sử dụng bullet points khi liệt kê
' Không giải thích dài dòng`;
}

// Web search tool for when needed
async function webSearch(query: string): Promise<string> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query + ' Hà Nội')}&limit=3&countrycodes=vn`,
      { headers: { 'User-Agent': 'MediBuk/1.0' } }
    );
    const data = await res.json();
    if (data.length === 0) return 'Không tìm thấy thông tin trên web.';
    return data.map((r: any) => `${r.display_name} (Vĩ độ: ${r.lat}, Kinh độ: ${r.lon})`).join('\n');
  } catch {
    return 'Không thể tìm kiếm trên web lúc này.';
  }
}

export async function POST(request: Request) {
  try {
    const { messages, stream = true } = await request.json();

    if (!OPENROUTER_API_KEY) {
      return NextResponse.json(
        { error: 'Chưa cấu hình API Key OpenRouter. Vui lòng thêm OPENROUTER_API_KEY vào file .env' },
        { status: 500 }
      );
    }

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: 'Tin nhắn không hợp lệ.' }, { status: 400 });
    }

    // Only block clearly unethical requests
    const lastUserMsg = messages[messages.length - 1]?.content || '';
    const blockedTopics = [
      'cách làm bom', 'cách hack', 'cách đánh cắp', 'cách lừa đảo',
      'cách giết người', 'cách tự tử', 'mua bán vũ khí', 'mua bán ma túy',
      'làm giả giấy tờ', 'trốn thuế', 'phân biệt chủng tộc'
    ];
    const lowerMsg = lastUserMsg.toLowerCase();
    const isBlocked = blockedTopics.some(topic => lowerMsg.includes(topic));

    if (isBlocked) {
      return NextResponse.json({
        content: 'Xin lỗi, tôi không thể giúp bạn với yêu cầu này vì vi phạm đạo đức và pháp luật. Vui lòng hỏi câu hỏi khác.'
      });
    }

    // Build system prompt with CSV context
    const systemPrompt = await buildSystemPrompt();

    // Prepare messages with system prompt
    const apiMessages = [
      { role: 'system', content: systemPrompt },
      ...messages.slice(-20) // Keep last 20 messages for context
    ];

    // Check if user needs web search
    const needsWebSearch = lastUserMsg.toLowerCase().includes('tìm') || 
                           lastUserMsg.toLowerCase().includes('tra cứu') ||
                           lastUserMsg.toLowerCase().includes('search') ||
                           lastUserMsg.toLowerCase().includes('địa chỉ') ||
                           lastUserMsg.toLowerCase().includes('ở đâu');

    if (needsWebSearch) {
      const searchResult = await webSearch(lastUserMsg);
      apiMessages.push({
        role: 'system',
        content: `Kết quả tìm kiếm trên web: ${searchResult}\n\nDựa trên kết quả này để trả lời người dùng.`
      });
    }

    // Use streaming for fast response
    if (stream) {
      const response = await fetch(OPENROUTER_BASE_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'HTTP-Referer': 'https://medibuk.vercel.app',
          'X-OpenRouter-Title': 'MediBuk Medical Assistant',
        },
        body: JSON.stringify({
          model: 'google/gemma-4-31b-it:free',
          messages: apiMessages,
          max_tokens: 1024,
          temperature: 0.7,
          stream: true,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('OpenRouter error:', response.status, errorData);
        return NextResponse.json(
          { error: `Lỗi từ OpenRouter: ${response.status} - ${errorData.error?.message || 'Unknown error'}` },
          { status: response.status }
        );
      }

      // Stream the response
      const reader = response.body?.getReader();
      const encoder = new TextEncoder();

      const streamResponse = new ReadableStream({
        async start(controller) {
          if (!reader) {
            controller.close();
            return;
          }

          try {
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;

              const chunk = new TextDecoder().decode(value);
              const lines = chunk.split('\n').filter(line => line.trim() !== '');

              for (const line of lines) {
                if (line.startsWith('data: ')) {
                  const data = line.slice(6);
                  if (data === '[DONE]') {
                    controller.enqueue(encoder.encode('data: [DONE]\n\n'));
                  } else {
                    try {
                      const parsed = JSON.parse(data);
                      const content = parsed.choices?.[0]?.delta?.content;
                      if (content) {
                        controller.enqueue(
                          encoder.encode(`data: ${JSON.stringify({ content })}\n\n`)
                        );
                      }
                    } catch {}
                  }
                }
              }
            }
          } catch (error) {
            console.error('Stream error:', error);
          } finally {
            controller.close();
          }
        },
      });

      return new Response(streamResponse, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      });
    }

    // Non-streaming fallback
    const response = await fetch(OPENROUTER_BASE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'HTTP-Referer': 'https://medibuk.vercel.app',
        'X-OpenRouter-Title': 'MediBuk Medical Assistant',
      },
      body: JSON.stringify({
        model: 'google/gemma-4-31b-it:free',
        messages: apiMessages,
        max_tokens: 1024,
        temperature: 0.7,
        stream: false,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: `Lỗi từ OpenRouter: ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || 'Xin lỗi, tôi không thể trả lời lúc này.';

    return NextResponse.json({ content });

  } catch (error: any) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: error.message || 'Lỗi xử lý yêu cầu.' },
      { status: 500 }
    );
  }
}
