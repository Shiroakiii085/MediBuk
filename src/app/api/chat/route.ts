import { NextResponse } from 'next/server';
import { readCSV } from '@/lib/githubDb';

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1/chat/completions';

const MODELS = [
  'openai/gpt-4o-mini',
  'openai/gpt-oss-120b:free',
  'meta-llama/llama-3.3-70b-instruct:free',
  'google/gemma-4-31b-it:free',
  'nvidia/nemotron-3-super-120b-a12b:free',
] as const;

const FETCH_TIMEOUT_MS = 30000;

// Compact system prompt - only summaries
async function buildSystemPrompt(): Promise<string> {
  try {
    const [clinics, doctors, symptoms] = await Promise.all([
      readCSV<any>('clinics.csv').catch(() => []),
      readCSV<any>('doctors.csv').catch(() => []),
      readCSV<any>('symptoms.csv').catch(() => []),
    ]);

    // Compact clinic summary: group by city, only name + specialties
    const clinicsByCity: Record<string, string[]> = {};
    clinics.forEach((c: any) => {
      const addr = c.address || '';
      let city = 'Khác';
      if (addr.includes('Hà Nội') || addr.includes('Hai Bà') || addr.includes('Đống Đa') || addr.includes('Hoàn Kiếm') || addr.includes('Cầu Giấy') || addr.includes('Ba Đình') || addr.includes('Long Biên') || addr.includes('Tây Hồ') || addr.includes('Thanh Nhàn') || addr.includes('Bách Khoa') || addr.includes('Phương Mai') || addr.includes('Ngọc Hà')) city = 'Hà Nội';
      else if (addr.includes('Đà Nẵng') || addr.includes('Hải Châu') || addr.includes('Thanh Khê') || addr.includes('Ngũ Hành') || addr.includes('Liên Chiểu') || addr.includes('Cẩm Lệ') || addr.includes('Sơn Trà')) city = 'Đà Nẵng';
      else if (addr.includes('TP.HCM') || addr.includes('Quận') || addr.includes('Thành phố Hồ Chí Minh')) city = 'TP.HCM';
      else if (addr.includes('Hải Phòng')) city = 'Hải Phòng';
      else if (addr.includes('Cần Thơ')) city = 'Cần Thơ';
      else if (addr.includes('Nha Trang') || addr.includes('Khánh Hòa')) city = 'Nha Trang';
      else if (addr.includes('Huế')) city = 'Huế';
      else if (addr.includes('Quy Nhơn') || addr.includes('Bình Định')) city = 'Quy Nhơn';
      else if (addr.includes('Nghệ An') || addr.includes('Vinh')) city = 'Vinh';
      else if (addr.includes('Đà Lạt') || addr.includes('Lâm Đồng')) city = 'Đà Lạt';
      else if (addr.includes('Nam Định')) city = 'Nam Định';
      else if (addr.includes('Thanh Hóa')) city = 'Thanh Hóa';
      else if (addr.includes('Hải Dương')) city = 'Hải Dương';
      if (!clinicsByCity[city]) clinicsByCity[city] = [];
      clinicsByCity[city].push(`${c.name} [${c.specialties.split(';').slice(0, 3).join(';')}]`);
    });

    const clinicSummary = Object.entries(clinicsByCity)
      .map(([city, list]) => `${city} (${list.length} BV): ${list.join(', ')}`)
      .join('\n');

    // Compact doctor summary: only top 2 per specialty
    const specialtyDoctors: Record<string, string[]> = {};
    doctors.forEach((d: any) => {
      const spec = d.specialty.split(';')[0];
      if (!specialtyDoctors[spec]) specialtyDoctors[spec] = [];
      if (specialtyDoctors[spec].length < 2) {
        const clinic = clinics.find((c: any) => c.clinic_id.toString() === d.clinic_id.toString());
        specialtyDoctors[spec].push(`${d.name} (${clinic?.name || 'N/A'})`);
      }
    });
    const doctorSummary = Object.entries(specialtyDoctors)
      .map(([spec, list]) => `${spec}: ${list.join(', ')}`)
      .join('\n');

    // Compact symptom list: only name + specialty
    const symptomSummary = symptoms.map((s: any) => `${s.name} -> ${s.specialty_hint}`).join(', ');

    return `BẠN LÀ MediDora - TRỢ LÝ AI CỦA MEDIBUK - HỆ THỐNG ĐẶT LỊCH KHÁM BỆNH.
Tên của bạn là MediDora. Hãy giới thiệu bản thân là MediDora khi được hỏi.

DỮ LIỆU BỆNH VIỆN (${clinics.length} bệnh viện, 13 thành phố):
${clinicSummary}

DỮ LIỆU BÁC SĨ (${doctors.length} bác sĩ):
${doctorSummary}

DỮ LIỆU TRIỆU CHỨNG (${symptoms.length} triệu chứng):
${symptomSummary}

WORKFLOW:
1. TRIỆU CHỨNG -> CHUYÊN KHOA -> BỆNH VIỆN -> BÁC SĨ -> Hướng dẫn đặt lịch /booking
2. TÌM BỆNH VIỆN -> Hỏi thành phố -> Liệt kê bệnh viện thành phố đó
3. ĐẶT LỊCH -> Hướng dẫn 6 bước: Nhập địa chỉ -> Chọn BV -> Chọn BS -> Nhập triệu chứng -> Chọn ngày giờ -> Xác nhận

NGUYÊN TẮC:
- Trả lời bằng tiếng Việt, ngắn gọn, súc tích
- Dùng ' thay * hoặc -
- Nếu triệu chứng nghiêm trọng (severe) cảnh báo đến bệnh viện ngay
- Luôn gợi ý đặt lịch /booking nếu liên quan khám bệnh
- Không đưa chẩn đoán chính xác, chỉ tư vấn sơ bộ`;
  } catch (error) {
    console.error('Error building system prompt:', error);
    return 'Bạn là MediDora, trợ lý AI của MediBuk. Trả lời bằng tiếng Việt, ngắn gọn.';
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { messages } = body;

    if (!OPENROUTER_API_KEY) {
      return NextResponse.json(
        { error: 'Chưa cấu hình API Key OpenRouter.' },
        { status: 500 }
      );
    }

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: 'Tin nhắn không hợp lệ.' }, { status: 400 });
    }

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
        content: 'Xin lỗi, tôi không thể giúp bạn với yêu cầu này vì vi phạm đạo đức và pháp luật.'
      });
    }

    const systemPrompt = await buildSystemPrompt();

    const apiMessages = [
      { role: 'system', content: systemPrompt },
      ...messages.slice(-20)
    ];

    let lastError = '';

    for (const model of MODELS) {
      for (let attempt = 1; attempt <= 2; attempt++) {
        try {
          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

          const response = await fetch(OPENROUTER_BASE_URL, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
              'HTTP-Referer': 'https://medi-buk.vercel.app',
              'X-OpenRouter-Title': 'MediBuk Medical Assistant',
            },
            body: JSON.stringify({
              model,
              messages: apiMessages,
              max_tokens: 1024,
              temperature: 0.7,
              stream: true,
            }),
            signal: controller.signal,
          });

          clearTimeout(timeout);

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            lastError = `${response.status}: ${errorData.error?.message || 'Unknown'}`;
            console.error(`OpenRouter error [${model}] (attempt ${attempt}):`, lastError);

            if (response.status === 429 || response.status === 502 || response.status === 503) {
              if (attempt < 2) await new Promise(r => setTimeout(r, attempt * 2000));
              continue;
            }

            break;
          }

          const reader = response.body?.getReader();
          if (!reader) {
            lastError = 'No reader';
            break;
          }

          const encoder = new TextEncoder();
          const streamResponse = new ReadableStream({
            async start(controller) {
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
                            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content })}\n\n`));
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
            headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', 'Connection': 'keep-alive' },
          });
        } catch (err: any) {
          lastError = err.name === 'AbortError' ? 'Timeout' : (err.message || 'Network error');
          console.error(`Fetch error [${model}] (attempt ${attempt}):`, lastError);
          if (attempt < 2) await new Promise(r => setTimeout(r, attempt * 2000));
        }
      }
    }

    return NextResponse.json(
      { error: `AI đang bận, vui lòng thử lại sau. (${lastError})` },
      { status: 503 }
    );

  } catch (error: any) {
    console.error('Chat API fatal error:', error);
    return NextResponse.json(
      { error: 'Lỗi xử lý yêu cầu. Vui lòng thử lại.' },
      { status: 500 }
    );
  }
}
