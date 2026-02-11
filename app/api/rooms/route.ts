import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');

  if (!startDate || !endDate) {
    return NextResponse.json(
      { error: 'startDate and endDate are required' },
      { status: 400 }
    );
  }

  try {
    const response = await fetch(
      `https://lille-epiroom.epitest.eu/api/v1/planning?startDate=${startDate}&endDate=${endDate}`,
      {
        headers: {
          'Accept': 'application/json',
        },
        cache: 'no-store', // Don't cache to get real-time data
      }
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch room data' },
        { status: response.status }
      );
    }

    const data = await response.json();

    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      },
    });
  } catch (error) {
    console.error('Error fetching room data:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
