import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getSupabaseServiceClient } from '@/lib/db/client';
import bcrypt from 'bcryptjs';

// GET single user
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 403 }
      );
    }

    const supabase = getSupabaseServiceClient();
    
    const { data, error } = await supabase
      .from('users')
      .select('id, email, name, role, region, created_at, updated_at')
      .eq('id', params.id)
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Error in GET /api/users/[id]:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// PUT update user
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { email, name, role, region, password } = body;

    // Validation
    if (!email || !name || !role) {
      return NextResponse.json(
        { error: 'Email, nombre y rol son requeridos' },
        { status: 400 }
      );
    }

    // Validate role
    const validRoles = ['admin', 'coordinator_national', 'coordinator_regional', 'technician', 'warehouse', 'auditor'];
    if (!validRoles.includes(role)) {
      return NextResponse.json(
        { error: 'Rol inválido' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseServiceClient();

    // Check if email already exists for another user
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .neq('id', params.id)
      .single();

    if (existingUser) {
      return NextResponse.json(
        { error: 'El email ya está registrado por otro usuario' },
        { status: 400 }
      );
    }

    // Build update object
    const updateData: Record<string, unknown> = {
      email,
      name,
      role,
      region: region || null,
      updated_at: new Date().toISOString(),
    };

    // Hash password if provided
    if (password && password.length >= 6) {
      updateData.password_hash = await bcrypt.hash(password, 10);
    }

    // Update user
    const { data, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', params.id)
      .select('id, email, name, role, region, created_at, updated_at')
      .single();

    if (error) {
      console.error('Error updating user:', error);
      return NextResponse.json(
        { error: 'Error al actualizar usuario' },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Error in PUT /api/users/[id]:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// DELETE user
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 403 }
      );
    }

    // Prevent self-deletion
    if (session.user.id === params.id) {
      return NextResponse.json(
        { error: 'No puedes eliminar tu propia cuenta' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseServiceClient();
    
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', params.id);

    if (error) {
      console.error('Error deleting user:', error);
      return NextResponse.json(
        { error: 'Error al eliminar usuario' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/users/[id]:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
