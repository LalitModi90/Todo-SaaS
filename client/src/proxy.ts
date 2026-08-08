import { NextResponse } from 'next/server';

export default function proxy(request) {
  return NextResponse.next();
}
