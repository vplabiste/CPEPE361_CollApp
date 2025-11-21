import { NextResponse } from 'next/server';
import { getPlatformSettings } from '@/app/actions/settings';

// Disable caching for this route to ensure fresh data
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const settings = await getPlatformSettings();
    return NextResponse.json(settings);
  } catch (error) {
    console.error('API Error fetching settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    );
  }
}
