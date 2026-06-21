import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createServiceClient } from '@/utils/supabase/service'

const ADMIN_USER_IDS = (process.env.ADMIN_CLERK_IDS || '').split(',').filter(Boolean)

function isAdmin(userId: string): boolean {
  if (ADMIN_USER_IDS.length === 0) return false
  return ADMIN_USER_IDS.includes(userId)
}

const CHAPTERS_DATA = [
  // Physics (1-32)
  { id: 1, chapter_name: 'Math in Physics', subject: 'Physics' },
  { id: 2, chapter_name: 'Units & Dimensions', subject: 'Physics' },
  { id: 3, chapter_name: 'Motion in 1D', subject: 'Physics' },
  { id: 4, chapter_name: 'Motion in 2D', subject: 'Physics' },
  { id: 5, chapter_name: 'Laws of Motion', subject: 'Physics' },
  { id: 6, chapter_name: 'Work Power Energy', subject: 'Physics' },
  { id: 7, chapter_name: 'COM & Collisions', subject: 'Physics' },
  { id: 8, chapter_name: 'Rotational Motion', subject: 'Physics' },
  { id: 9, chapter_name: 'Gravitation', subject: 'Physics' },
  { id: 10, chapter_name: 'Properties of Solids', subject: 'Physics' },
  { id: 11, chapter_name: 'Properties of Fluids', subject: 'Physics' },
  { id: 12, chapter_name: 'Thermal Properties', subject: 'Physics' },
  { id: 13, chapter_name: 'Thermodynamics', subject: 'Physics' },
  { id: 14, chapter_name: 'KTG', subject: 'Physics' },
  { id: 15, chapter_name: 'Oscillations', subject: 'Physics' },
  { id: 16, chapter_name: 'Waves & Sound', subject: 'Physics' },
  { id: 17, chapter_name: 'Electrostatics', subject: 'Physics' },
  { id: 18, chapter_name: 'Capacitance', subject: 'Physics' },
  { id: 19, chapter_name: 'Current Electricity', subject: 'Physics' },
  { id: 20, chapter_name: 'Magnetic Properties', subject: 'Physics' },
  { id: 21, chapter_name: 'Magnetism & Current', subject: 'Physics' },
  { id: 22, chapter_name: 'EMI', subject: 'Physics' },
  { id: 23, chapter_name: 'AC Circuits', subject: 'Physics' },
  { id: 24, chapter_name: 'EM Waves', subject: 'Physics' },
  { id: 25, chapter_name: 'Ray Optics', subject: 'Physics' },
  { id: 26, chapter_name: 'Wave Optics', subject: 'Physics' },
  { id: 27, chapter_name: 'Dual Nature', subject: 'Physics' },
  { id: 28, chapter_name: 'Atomic Physics', subject: 'Physics' },
  { id: 29, chapter_name: 'Nuclear Physics', subject: 'Physics' },
  { id: 30, chapter_name: 'Semiconductors', subject: 'Physics' },
  { id: 31, chapter_name: 'Communication Systems', subject: 'Physics' },
  { id: 32, chapter_name: 'Experimental Physics', subject: 'Physics' },

  // Chemistry (33-59)
  { id: 33, chapter_name: 'Mole Concept', subject: 'Chemistry' },
  { id: 34, chapter_name: 'Atomic Structure', subject: 'Chemistry' },
  { id: 35, chapter_name: 'Periodic Table', subject: 'Chemistry' },
  { id: 36, chapter_name: 'Chemical Bonding', subject: 'Chemistry' },
  { id: 37, chapter_name: 'States of Matter', subject: 'Chemistry' },
  { id: 38, chapter_name: 'Thermodynamics', subject: 'Chemistry' },
  { id: 39, chapter_name: 'Chemical Equilibrium', subject: 'Chemistry' },
  { id: 40, chapter_name: 'Ionic Equilibrium', subject: 'Chemistry' },
  { id: 41, chapter_name: 'Redox Reaction', subject: 'Chemistry' },
  { id: 42, chapter_name: 'Hydrogen', subject: 'Chemistry' },
  { id: 43, chapter_name: 'S Block', subject: 'Chemistry' },
  { id: 44, chapter_name: 'P Block (13-14)', subject: 'Chemistry' },
  { id: 45, chapter_name: 'General Organic Chemistry (GOC)', subject: 'Chemistry' },
  { id: 46, chapter_name: 'Hydrocarbons', subject: 'Chemistry' },
  { id: 47, chapter_name: 'Solutions', subject: 'Chemistry' },
  { id: 48, chapter_name: 'Electrochemistry', subject: 'Chemistry' },
  { id: 49, chapter_name: 'Chemical Kinetics', subject: 'Chemistry' },
  { id: 50, chapter_name: 'P Block (15-18)', subject: 'Chemistry' },
  { id: 51, chapter_name: 'd & f Block', subject: 'Chemistry' },
  { id: 52, chapter_name: 'Coordination Compounds', subject: 'Chemistry' },
  { id: 53, chapter_name: 'Haloalkanes & Haloarenes', subject: 'Chemistry' },
  { id: 54, chapter_name: 'Alcohols, Phenols & Ethers', subject: 'Chemistry' },
  { id: 55, chapter_name: 'Aldehydes & Ketones', subject: 'Chemistry' },
  { id: 56, chapter_name: 'Carboxylic Acids', subject: 'Chemistry' },
  { id: 57, chapter_name: 'Amines', subject: 'Chemistry' },
  { id: 58, chapter_name: 'Biomolecules', subject: 'Chemistry' },
  { id: 59, chapter_name: 'Practical Chemistry', subject: 'Chemistry' },

  // Mathematics (60-90)
  { id: 60, chapter_name: 'Basic Mathematics', subject: 'Mathematics' },
  { id: 61, chapter_name: 'Quadratic Equations', subject: 'Mathematics' },
  { id: 62, chapter_name: 'Complex Numbers', subject: 'Mathematics' },
  { id: 63, chapter_name: 'Permutation & Combination', subject: 'Mathematics' },
  { id: 64, chapter_name: 'Sequence & Series', subject: 'Mathematics' },
  { id: 65, chapter_name: 'Binomial Theorem', subject: 'Mathematics' },
  { id: 66, chapter_name: 'Trigonometry', subject: 'Mathematics' },
  { id: 67, chapter_name: 'Trigonometric Equations', subject: 'Mathematics' },
  { id: 68, chapter_name: 'Straight Lines', subject: 'Mathematics' },
  { id: 69, chapter_name: 'Circle', subject: 'Mathematics' },
  { id: 70, chapter_name: 'Parabola', subject: 'Mathematics' },
  { id: 71, chapter_name: 'Ellipse', subject: 'Mathematics' },
  { id: 72, chapter_name: 'Hyperbola', subject: 'Mathematics' },
  { id: 73, chapter_name: 'Limits', subject: 'Mathematics' },
  { id: 74, chapter_name: 'Statistics', subject: 'Mathematics' },
  { id: 75, chapter_name: 'Sets & Relations', subject: 'Mathematics' },
  { id: 76, chapter_name: 'Matrices', subject: 'Mathematics' },
  { id: 77, chapter_name: 'Determinants', subject: 'Mathematics' },
  { id: 78, chapter_name: 'Inverse Trigonometric Functions', subject: 'Mathematics' },
  { id: 79, chapter_name: 'Functions', subject: 'Mathematics' },
  { id: 80, chapter_name: 'Continuity & Differentiability', subject: 'Mathematics' },
  { id: 81, chapter_name: 'Differentiation', subject: 'Mathematics' },
  { id: 82, chapter_name: 'Application of Derivatives', subject: 'Mathematics' },
  { id: 83, chapter_name: 'Indefinite Integration', subject: 'Mathematics' },
  { id: 84, chapter_name: 'Definite Integration', subject: 'Mathematics' },
  { id: 85, chapter_name: 'Area Under Curves', subject: 'Mathematics' },
  { id: 86, chapter_name: 'Differential Equations', subject: 'Mathematics' },
  { id: 87, chapter_name: 'Vector Algebra', subject: 'Mathematics' },
  { id: 88, chapter_name: '3D Geometry', subject: 'Mathematics' },
  { id: 89, chapter_name: 'Linear Programming', subject: 'Mathematics' },
  { id: 90, chapter_name: 'Probability', subject: 'Mathematics' }
]

export async function POST(req: Request) {
  try {
    const { userId } = await auth()
    if (!userId || !isAdmin(userId)) {
      return new NextResponse("Forbidden", { status: 403 })
    }

    const supabase = createServiceClient()

    // 1. Delete existing chapters (CASCADE)
    const { error: deleteError } = await supabase
      .from('chapters')
      .delete()
      .neq('id', 0) // Delete all

    if (deleteError) {
      console.error("[Seed Chapters] Delete error:", deleteError)
      return NextResponse.json({ error: deleteError.message }, { status: 500 })
    }

    // 2. Insert chapters
    // Note: In Javascript supabase-js client, inserting explicitly with the "id" key 
    // will successfully use the OVERRIDING SYSTEM VALUE behaviour under the hood 
    // or through PostgREST.
    const { data, error: insertError } = await supabase
      .from('chapters')
      .insert(CHAPTERS_DATA)
      .select()

    if (insertError) {
      console.error("[Seed Chapters] Insert error:", insertError)
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      count: data?.length || 0,
      message: `Successfully seeded ${data?.length || 0} chapters.`
    })

  } catch (err: any) {
    console.error("[Seed Chapters] Server error:", err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
