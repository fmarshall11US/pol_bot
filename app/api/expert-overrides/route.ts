import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { createEmbedding } from "@/lib/openai";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const isActive = searchParams.get('active') !== 'false';
    
    const supabase = getSupabaseAdmin();
    
    const { data: overrides, error } = await supabase
      .from('expert_overrides')
      .select('*')
      .eq('is_active', isActive)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching overrides:', error);
      return NextResponse.json({ error: 'Failed to fetch overrides' }, { status: 500 });
    }
    
    return NextResponse.json(overrides || []);
  } catch (error) {
    console.error('GET expert overrides error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      originalQuestion,
      originalAnswer,
      correctedAnswer,
      expertExplanation,
      expertId,
      confidenceThreshold = 0.85,
      appliesToAllDocuments = false,
      documentIds = []
    } = body;
    
    // Validate required fields
    if (!originalQuestion || !originalAnswer || !correctedAnswer || !expertId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    console.log('🔧 Creating expert override for question:', originalQuestion);
    
    // Generate embedding for the original question
    const questionEmbedding = await createEmbedding(originalQuestion);
    
    const supabase = getSupabaseAdmin();
    
    // Create the override
    const { data: override, error: createError } = await supabase
      .from('expert_overrides')
      .insert({
        original_question: originalQuestion,
        original_answer: originalAnswer,
        corrected_answer: correctedAnswer,
        expert_explanation: expertExplanation,
        expert_id: expertId,
        question_embedding: questionEmbedding,
        confidence_threshold: confidenceThreshold,
        applies_to_all_documents: appliesToAllDocuments,
        document_ids: documentIds
      })
      .select()
      .single();
    
    if (createError) {
      console.error('Error creating override:', createError);
      return NextResponse.json(
        { error: 'Failed to create override' },
        { status: 500 }
      );
    }
    
    // Create initial version record
    const { error: versionError } = await supabase
      .from('override_versions')
      .insert({
        override_id: override.id,
        version_number: 1,
        corrected_answer: correctedAnswer,
        expert_explanation: expertExplanation,
        changed_by: expertId,
        change_reason: 'Initial creation'
      });
    
    if (versionError) {
      console.error('Error creating version record:', versionError);
    }
    
    console.log('✅ Expert override created successfully');
    
    return NextResponse.json({
      success: true,
      override: override
    });
    
  } catch (error) {
    console.error('POST expert override error:', error);
    return NextResponse.json(
      { error: 'Failed to create override' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      id,
      correctedAnswer,
      expertExplanation,
      confidenceThreshold,
      isActive,
      appliesToAllDocuments,
      documentIds,
      changedBy,
      changeReason
    } = body;
    
    if (!id) {
      return NextResponse.json(
        { error: 'Override ID is required' },
        { status: 400 }
      );
    }
    
    const supabase = getSupabaseAdmin();
    
    // Get current override for version tracking
    const { data: currentOverride } = await supabase
      .from('expert_overrides')
      .select('*')
      .eq('id', id)
      .single();
    
    if (!currentOverride) {
      return NextResponse.json(
        { error: 'Override not found' },
        { status: 404 }
      );
    }
    
    // Prepare update object
    const updateData: any = {};
    if (correctedAnswer !== undefined) updateData.corrected_answer = correctedAnswer;
    if (expertExplanation !== undefined) updateData.expert_explanation = expertExplanation;
    if (confidenceThreshold !== undefined) updateData.confidence_threshold = confidenceThreshold;
    if (isActive !== undefined) updateData.is_active = isActive;
    if (appliesToAllDocuments !== undefined) updateData.applies_to_all_documents = appliesToAllDocuments;
    if (documentIds !== undefined) updateData.document_ids = documentIds;
    
    // Update the override
    const { data: updatedOverride, error: updateError } = await supabase
      .from('expert_overrides')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    
    if (updateError) {
      console.error('Error updating override:', updateError);
      return NextResponse.json(
        { error: 'Failed to update override' },
        { status: 500 }
      );
    }
    
    // Create version record if answer was changed
    if (correctedAnswer && correctedAnswer !== currentOverride.corrected_answer) {
      // Get current version number
      const { data: versions } = await supabase
        .from('override_versions')
        .select('version_number')
        .eq('override_id', id)
        .order('version_number', { ascending: false })
        .limit(1);
      
      const nextVersion = versions && versions.length > 0 ? versions[0].version_number + 1 : 1;
      
      await supabase
        .from('override_versions')
        .insert({
          override_id: id,
          version_number: nextVersion,
          corrected_answer: correctedAnswer,
          expert_explanation: expertExplanation || currentOverride.expert_explanation,
          changed_by: changedBy || 'Unknown',
          change_reason: changeReason || 'Updated'
        });
    }
    
    return NextResponse.json({
      success: true,
      override: updatedOverride
    });
    
  } catch (error) {
    console.error('PATCH expert override error:', error);
    return NextResponse.json(
      { error: 'Failed to update override' },
      { status: 500 }
    );
  }
}