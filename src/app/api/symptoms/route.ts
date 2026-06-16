import { NextResponse } from 'next/server';
import { readCSV } from '@/lib/githubDb';

interface Symptom {
  symptom_id: string;
  name: string;
  specialty_hint: string;
  severity: string;
  description: string;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';
    
    const symptoms = await readCSV<Symptom>('symptoms.csv');
    
    if (!query.trim()) {
      return NextResponse.json({ symptoms: symptoms.slice(0, 20) });
    }
    
    const normalizedQuery = query.toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd');
    
    const filtered = symptoms.filter(s => {
      const normalizedName = s.name.toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/g, 'd');
      return normalizedName.includes(normalizedQuery);
    });
    
    return NextResponse.json({ symptoms: filtered.slice(0, 10) });
  } catch (error: any) {
    console.error('Symptoms search error:', error);
    return NextResponse.json({ symptoms: [] });
  }
}
