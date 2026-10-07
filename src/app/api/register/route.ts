import { NextResponse } from "next/server";
import { hash, compare } from "bcryptjs";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { name, email, password } = await req.json();

    if (name) {
      if (!name || !email || !password) {
        return NextResponse.json(
          { error: "Semua data wajib diisi" },
          { status: 400 }
        );
      }

      // Cek apakah email sudah terdaftar
      const existingUser = await prisma.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        return NextResponse.json(
          { error: "Email sudah terdaftar" },
          { status: 409 }
        );
      }

      // Hash kata sandi
      const hashedPassword = await hash(password, 10);

      // Simpan data ke MySQL via Prisma
      const user = await prisma.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
        },
      });

      return NextResponse.json(
        { message: "Registrasi berhasil!", userId: user.id },
        { status: 201 }
      );
    }

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email dan kata sandi wajib diisi" },
        { status: 400 }
      );
    }

    // Cari user di database untuk login
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Email atau kata sandi salah" },
        { status: 401 }
      );
    }

    // Verifikasi kesesuaian password
    const passwordMatch = await compare(password, user.password);
    if (!passwordMatch) {
      return NextResponse.json(
        { error: "Kata sandi salah" },
        { status: 401 }
      );
    }

    return NextResponse.json({
      message: "Login berhasil",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (err) {
    return NextResponse.json(
      { error: "Gagal memproses permintaan" },
      { status: 500 }
    );
  }
}