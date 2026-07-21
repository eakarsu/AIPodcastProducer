module.exports={
 caseType:'versioned_podcast_release',initialState:'source_registered',
 states:['source_registered','rights_verified','timeline_edited','render_queued','rendered','render_failed','transcript_qa','publication_approved','published','exported'],
 createRoles:['producer','show_manager'],assessmentRoles:['producer','audio_editor','rights_reviewer','accessibility_reviewer'],auditRoles:['show_manager','rights_reviewer','publisher','auditor'],connectorRoles:['integration_operator','show_manager'],
 evidenceKinds:['source_manifest','guest_release','music_license','asset_manifest','timeline_version','render_job_receipt','audio_master_manifest','render_failure','transcript_version','caption_translation_report','quality_report','brand_moderation_report','approval_record','host_publish_receipt','export_manifest','usage_record'],
 requiredSignals:['sourceVersion','timelineVersion','assetVersion','renderVersion','rightsStatus','consentStatus','moderationStatus','accessibilityStatus','transcriptAlignment','audioIntegrity','exportProfile','policyVersion'],
 professionalBoundary:'Generated scripts, edits, transcripts, and show notes remain drafts; qualified rights, editorial, accessibility, brand, guest, and publisher reviewers approve release.',
 connectors:[{name:'media_model',purpose:'queued draft and render receipts only'},{name:'rights_asset_library',purpose:'music and guest release versions'},{name:'object_storage',purpose:'encrypted source and master pointers'},{name:'transcription_translation',purpose:'versioned transcript caption and locale receipts'},{name:'podcast_host',purpose:'signed host publish receipts'},{name:'video_publishing',purpose:'signed platform publish receipts'},{name:'usage_accounting',purpose:'metered provider and distribution receipts'}],
 transitions:[
  {from:'source_registered',action:'verify_rights',to:'rights_verified',roles:['rights_reviewer'],requiresEvidence:true},
  {from:'rights_verified',action:'lock_timeline',to:'timeline_edited',roles:['producer','audio_editor'],requiresEvidence:true},
  {from:'timeline_edited',action:'queue_render',to:'render_queued',roles:['audio_editor'],requiresEvidence:true},
  {from:'render_queued',action:'record_render',to:'rendered',roles:['integration_operator'],requiresEvidence:true},
  {from:'render_queued',action:'record_render_failure',to:'render_failed',roles:['integration_operator'],requiresEvidence:true},
  {from:'render_failed',action:'retry_render',to:'render_queued',roles:['audio_editor','integration_operator'],requiresEvidence:true},
  {from:'rendered',action:'submit_transcript_qa',to:'transcript_qa',roles:['accessibility_reviewer','producer'],requiresEvidence:true,dualControl:true},
  {from:'transcript_qa',action:'approve_publication',to:'publication_approved',roles:['show_manager','rights_reviewer'],requiresEvidence:true,dualControl:true},
  {from:'publication_approved',action:'record_publish',to:'published',roles:['publisher','show_manager'],requiresEvidence:true,dualControl:true},
  {from:'publication_approved',action:'record_export',to:'exported',roles:['producer'],requiresEvidence:true,dualControl:true}
 ],
 acceptedFixture:{sourceVersion:'s1',timelineVersion:'t1',assetVersion:'a1',renderVersion:'r1',rightsStatus:'verified',consentStatus:'verified',moderationStatus:'passed',accessibilityStatus:'passed',transcriptAlignment:0.99,audioIntegrity:0.99,exportProfile:'podcast_master',policyVersion:'p1'},
 readyDisposition:'human_publication_review_required',holdDisposition:'rights_quality_or_accessibility_hold',decisionField:'publishCommand',
 assess:x=>{const transcript=Number(x.transcriptAlignment),audio=Number(x.audioIntegrity);const quality=Number.isFinite(transcript)&&Number.isFinite(audio)&&transcript>=0.95&&audio>=0.98;const ready=quality&&x.rightsStatus==='verified'&&x.consentStatus==='verified'&&x.moderationStatus==='passed'&&x.accessibilityStatus==='passed'&&['podcast_master','video_master','accessible_archive'].includes(x.exportProfile);return{disposition:ready?'human_publication_review_required':'rights_quality_or_accessibility_hold',publishCommand:null,metrics:{transcriptAlignment:transcript,audioIntegrity:audio},versions:{source:x.sourceVersion,timeline:x.timelineVersion,assets:x.assetVersion,render:x.renderVersion}};}
};
