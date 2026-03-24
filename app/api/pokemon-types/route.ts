import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const response = await fetch('https://pokeapi.co/api/v2/type');
    const data = await response.json();
    
    // Filter out internal types like "unknown" and "shadow"
    const validTypes = data.results.filter(
      (type: { name: string, url: string }) => !['unknown', 'shadow'].includes(type.name)
    );

    return NextResponse.json({ results: validTypes });
  } catch (error) {
    console.error('Failed to fetch types:', error);
    return NextResponse.json({ error: 'Failed to fetch types' }, { status: 500 });
  }
}
