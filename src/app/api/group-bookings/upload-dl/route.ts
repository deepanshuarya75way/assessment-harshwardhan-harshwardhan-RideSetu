import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest, getServerSession } from '@/lib/auth';
import { GroupBookingService } from '@/services/group-booking.service';

export async function POST(req: NextRequest) {
  try {
    const session = getSessionFromRequest(req) || (await getServerSession());
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const groupId = formData.get('groupId') as string | null;
    const vehicleId = formData.get('vehicleId') as string | null;

    if (!file || !groupId || !vehicleId) {
      return NextResponse.json(
        { error: 'file, groupId, and vehicleId are required.' },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const result = await GroupBookingService.uploadRiderDLDocument({
      groupId,
      customerId: session.userId,
      vehicleId,
      fileBuffer: buffer,
      fileName: file.name,
      mimeType: file.type,
    });

    return NextResponse.json({
      success: true,
      documentUrl: result.documentUrl,
      storageKey: result.storageKey,
      group: result.group,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'DL document upload failed' }, { status: 400 });
  }
}
