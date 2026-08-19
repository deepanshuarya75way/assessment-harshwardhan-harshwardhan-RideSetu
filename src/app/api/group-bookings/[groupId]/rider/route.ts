import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest, getServerSession } from '@/lib/auth';
import { GroupBookingService } from '@/services/group-booking.service';

export async function POST(req: NextRequest, { params }: { params: { groupId: string } }) {
  try {
    const session = getSessionFromRequest(req) || (await getServerSession());
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { vehicleId, fullName, drivingLicenseNumber, drivingLicenseDocumentUrl, drivingLicenseDocumentKey, autoVerify } = body;

    if (!vehicleId || !fullName || !drivingLicenseNumber) {
      return NextResponse.json(
        { error: 'vehicleId, fullName, and drivingLicenseNumber are required.' },
        { status: 400 }
      );
    }

    const group = await GroupBookingService.assignRiderToVehicle({
      groupId: params.groupId,
      customerId: session.userId,
      vehicleId,
      fullName,
      drivingLicenseNumber,
      drivingLicenseDocumentUrl,
      drivingLicenseDocumentKey,
      autoVerify: autoVerify !== false,
    });

    return NextResponse.json({ success: true, group });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to assign rider' }, { status: 400 });
  }
}
