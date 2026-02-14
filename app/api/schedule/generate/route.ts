import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

type RoomTemplate = {
  id: string;
};

const MAX_HOURS = 48;
const DEFAULT_HOURS = 24;
const DEFAULT_DURATION_HOURS = 1;

function floorToHour(date: Date): Date {
  const copy = new Date(date);
  copy.setMinutes(0, 0, 0);
  return copy;
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const requestedHours = Number(body?.hours ?? DEFAULT_HOURS);
  const horizonHours = Number.isFinite(requestedHours)
    ? Math.min(Math.max(Math.floor(requestedHours), 1), MAX_HOURS)
    : DEFAULT_HOURS;

  const now = new Date();
  const windowStart = floorToHour(now);
  const windowEnd = new Date(windowStart);
  windowEnd.setHours(windowEnd.getHours() + horizonHours);

  const { data: templates, error: templateError } = await supabaseAdmin
    .from('room_templates')
    .select('id')
    .order('created_at', { ascending: true });

  if (templateError) {
    return NextResponse.json({ error: templateError.message }, { status: 500 });
  }

  const rowsToInsert: {
    template_id: string;
    start_at: string;
    end_at: string;
    status: 'scheduled';
  }[] = [];

  for (const template of (templates ?? []) as RoomTemplate[]) {
    for (let slot = new Date(windowStart); slot < windowEnd; slot.setHours(slot.getHours() + 1)) {
      const startAt = new Date(slot);
      const endAt = new Date(slot);
      endAt.setHours(endAt.getHours() + DEFAULT_DURATION_HOURS);
      rowsToInsert.push({
        template_id: template.id,
        start_at: startAt.toISOString(),
        end_at: endAt.toISOString(),
        status: 'scheduled',
      });
    }
  }

  if (!rowsToInsert.length) {
    return NextResponse.json({ inserted: 0, templates: 0, hours: horizonHours });
  }

  const { data: insertedRows, error: insertError } = await supabaseAdmin
    .from('scheduled_rooms')
    .upsert(rowsToInsert, {
      onConflict: 'template_id,start_at',
      ignoreDuplicates: true,
    })
    .select('id');

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  return NextResponse.json({
    inserted: insertedRows?.length ?? 0,
    templates: templates?.length ?? 0,
    hours: horizonHours,
  });
}
