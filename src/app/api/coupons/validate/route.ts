import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { Coupon } from '@/models/Coupon';

export async function POST(request: Request) {
  try {
    const { code, bookingValue = 0, category, city } = await request.json();

    if (!code) {
      return NextResponse.json({ error: 'Coupon code is required' }, { status: 400 });
    }

    await connectToDatabase();
    const coupon = await Coupon.findOne({
      code: code.trim().toUpperCase(),
      isActive: true,
    }).lean();

    if (!coupon) {
      return NextResponse.json({ error: 'Invalid or expired coupon code' }, { status: 404 });
    }

    if (new Date(coupon.expiryDate) < new Date()) {
      return NextResponse.json({ error: 'This coupon has expired' }, { status: 400 });
    }

    if (bookingValue < coupon.minimumBookingValue) {
      return NextResponse.json({
        error: `Minimum booking value for this coupon is ₹${coupon.minimumBookingValue}`,
      }, { status: 400 });
    }

    if (
      coupon.applicableVehicleCategories &&
      coupon.applicableVehicleCategories.length > 0 &&
      category &&
      !coupon.applicableVehicleCategories.includes(category.toUpperCase())
    ) {
      return NextResponse.json({
        error: `This coupon is not valid for ${category} category`,
      }, { status: 400 });
    }

    let discount = 0;
    if (coupon.discountType === 'PERCENTAGE') {
      discount = Math.min((bookingValue * coupon.discountValue) / 100, coupon.maximumDiscount);
    } else {
      discount = Math.min(coupon.discountValue, bookingValue);
    }

    return NextResponse.json({
      valid: true,
      coupon: {
        code: coupon.code,
        description: coupon.description,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        discountAmount: Math.round(discount),
      },
    });
  } catch (error: any) {
    console.error('[API Coupon Validate Error]:', error);
    return NextResponse.json({ error: error.message || 'Validation error' }, { status: 500 });
  }
}
