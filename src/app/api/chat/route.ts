import { NextResponse } from 'next/server';
import { readCSV } from '@/lib/githubDb';

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1/chat/completions';

async function buildSystemPrompt(): Promise<string> {
  const [clinics, doctors, symptoms] = await Promise.all([
    readCSV<any>('clinics.csv'),
    readCSV<any>('doctors.csv'),
    readCSV<any>('symptoms.csv'),
  ]);

  // Group clinics by city
  const clinicsByCity: Record<string, any[]> = {};
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
    clinicsByCity[city].push(c);
  });

  const clinicListByCity = Object.entries(clinicsByCity).map(([city, list]) => {
    const items = list.map((c: any) => `  + ${c.name} - ${c.address} [${c.specialties}]`).join('\n');
    return `${city}:\n${items}`;
  }).join('\n\n');

  const doctorList = doctors.map((d: any) => {
    const clinic = clinics.find((c: any) => c.clinic_id.toString() === d.clinic_id.toString());
    return `  + ${d.name} - ${d.specialty} - ${clinic?.name || 'N/A'} - Triệu chứng: ${d.symptoms}`;
  }).join('\n');

  const symptomList = symptoms.map((s: any) => 
    `  + ${s.name} (${s.severity}) -> Chuyên khoa: ${s.specialty_hint} - ${s.description}`
  ).join('\n');

  return `BẠN LÀ TRỢ LÝ AI CỦA MEDIBUK - HỆ THỐNG ĐẶT LỊCH KHÁM BỆNH TRỰC TUYẾN.

========================================
DỮ LIỆU BỆNH VIỆN THEO TỪNG THÀNH PHỐ:
========================================
${clinicListByCity}

========================================
DANH SÁCH BÁC SĨ (${doctors.length} bác sĩ):
========================================
${doctorList}

========================================
DANH SÁCH TRIỆU CHỨNG (${symptoms.length} triệu chứng):
========================================
${symptomList}

========================================
WORKFLOW HƯỚNG DẪN NGƯỜI DÙNG:
========================================

WORKFLOW 1: TƯ VẤN TRIỆU CHỨNG -> CHUYÊN KHOA
Khi người dùng mô tả triệu chứng:
  Bước 1: Xác định triệu chứng từ mô tả
  Bước 2: Gợi ý chuyên khoa phù hợp (dựa trên danh sách triệu chứng)
  Bước 3: Gợi ý bệnh viện có chuyên khoa đó (ưu tiên thành phố người dùng ở)
  Bước 4: Gợi ý bác sĩ phù hợp tại bệnh viện đó
  Bước 5: Hướng dẫn đặt lịch tại /booking

WORKFLOW 2: TÌM BỆNH VIỆN GẦN NHẤT
Khi người dùng hỏi bệnh viện gần nhất:
  Bước 1: Hỏi địa chỉ/thành phố của người dùng
  Bước 2: Liệt kê bệnh viện tại thành phố đó
  Bước 3: Sắp xếp theo chuyên khoa phù hợp
  Bước 4: Hướng dẫn đến /booking để đặt lịch

WORKFLOW 3: ĐẶT LỊCH KHÁM
Khi người dùng muốn đặt lịch:
  Bước 1: Giới thiệu quy trình 3 bước
  Bước 2: Hướng dẫn nhập địa chỉ để tìm bệnh viện gần
  Bước 3: Hướng dẫn chọn bệnh viện và bác sĩ
  Bước 4: Hướng dẫn nhập triệu chứng
  Bước 5: Chọn ngày giờ khám
  Bước 6: Xác nhận và nhận email

WORKFLOW 4: TRẢ LỜI CÂU HỎI TỔNG QUÁT
Khi người dùng hỏi về y tế/không liên quan MediBuk:
  + Trả lời ngắn gọn, súc tích
  + Nếu liên quan y tế, gợi ý đến bệnh viện phù hợp
  + Luôn kết thúc bằng gợi ý đặt lịch nếu phù hợp

========================================
NGUYÊN TẮC TRẢ LỜI:
========================================
+ Luôn trả lời bằng tiếng Việt
+ Sử dụng ' thay vì * hoặc - để liệt kê
+ Ngắn gọn, súc tích, không dài dòng
+ Nếu nghiêm trọng (severe) cảnh báo đến bệnh viện ngay
+ Luôn gợi ý đặt lịch tại /booking nếu liên quan khám bệnh
+ Không đưa chẩn đoán chính xác, chỉ tư vấn sơ bộ`;
}

async function webSearch(query: string): Promise<string> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=3&countrycodes=vn`,
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

    const systemPrompt = await buildSystemPrompt();

    const apiMessages = [
      { role: 'system', content: systemPrompt },
      ...messages.slice(-20)
    ];

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
