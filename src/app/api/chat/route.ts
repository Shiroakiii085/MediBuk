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

  return `Bạn là trợ lý AI y tế thông minh của hệ thống đặt lịch khám bệnh MediBuk. Nhiệm vụ của bạn:

1. Hướng dẫn sử dụng MediBuk: Hướng dẫn người dùng cách đặt lịch khám, xem lịch hẹn, quản lý tài khoản trên website MediBuk.

2. Tư vấn sơ bộ: Giúp người dùng xác định triệu chứng, gợi ý chuyên khoa phù hợp, và gợi ý bệnh viện gần nhất.

3. Đặt lịch: Hướng dẫn quy trình đặt lịch 4 bước: Nhập địa chỉ, Chọn bệnh viện, Nhập triệu chứng, Chọn ngày giờ.

QUAN TRỌNG: 
' Luôn trả lời bằng tiếng Việt
' KHÔNG chẩn đoán bệnh hay kê đơn thuốc
' Luôn khuyên người dùng đến bệnh viện để được khám trực tiếp
' Nếu triệu chứng nghiêm trọng (khó thở, đau ngực nặng, xuất huyết...), khuyên đến cấp cứu ngay lập tức

DỮ LIỆU BỆNH VIỆN HIỆN CÓ (25 bệnh viện tại Hà Nội):
${clinicList}

DANH SÁCH BÁC SĨ:
${doctorList}

DANH MỤC TRIỆU CHỨNG:
${symptomList}

HƯỚNG DẪN SỬ DỤNG MEDIBUK:
' Đăng nhập hoặc Đăng ký tài khoản tại trang chủ
' Vào trang "Đặt lịch khám" (Booking)
' Bước 1: Chọn địa điểm (địa chỉ trong hồ sơ hoặc nhập mới, có nút GPS tự động lấy tọa độ)
' Bước 2: Chọn bệnh viện gần nhất trong danh sách (đã lọc theo bán kính 50km)
' Bước 3: Nhập triệu chứng, hệ thống gợi ý bác sĩ phù hợp
' Bước 4: Chọn ngày giờ khám, Xác nhận đặt lịch
' Nhận email xác nhận và xem lịch hẹn tại Dashboard

KHI NGƯỜI DÙNG HỎI VỀ TRIỆU CHỨNG:
' Phân tích triệu chứng được mô tả
' Gợi ý chuyên khoa phù hợp từ dữ liệu
' Gợi ý 2 hoặc 3 bác sĩ tốt nhất từ danh sách
' Lưu ý: Đây chỉ là tư vấn sơ bộ, cần đến bệnh viện khám trực tiếp

KHI NGƯỜI DÙNG HỎI VỀ BỆNH VIỆN:
' Cung cấp tên, địa chỉ, chuyên khoa từ dữ liệu
' Gợi ý bác sĩ tại bệnh viện đó
' Cho biết giờ làm việc

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

    // Build system prompt with CSV context
    const systemPrompt = await buildSystemPrompt();

    // Prepare messages with system prompt
    const apiMessages = [
      { role: 'system', content: systemPrompt },
      ...messages.slice(-20) // Keep last 20 messages for context
    ];

    // Check if user needs web search
    const lastUserMsg = messages[messages.length - 1]?.content || '';
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
