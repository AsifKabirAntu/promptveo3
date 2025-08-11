// Video Validation Utilities
import { EnhancedSceneParameters, ENHANCED_VIDEO_STYLES } from '@/features/product-analysis/types';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  suggestions: string[];
}

export interface SceneValidationResult extends ValidationResult {
  sceneNumber: number;
  fixes?: Partial<EnhancedSceneParameters>;
}

/**
 * Validate generated scenes for quality and consistency
 */
export function validateGeneratedScenes(
  scenes: EnhancedSceneParameters[],
  videoStyle: string,
  expectedSceneCount: number
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const suggestions: string[] = [];

  // Validate scene count
  if (scenes.length !== expectedSceneCount) {
    errors.push(`Expected ${expectedSceneCount} scenes, got ${scenes.length}`);
  }

  // Validate each scene
  const sceneValidations = scenes.map(scene => validateSingleScene(scene, videoStyle));
  
  // Collect errors and warnings from individual scenes
  sceneValidations.forEach(validation => {
    errors.push(...validation.errors.map(err => `Scene ${validation.sceneNumber}: ${err}`));
    warnings.push(...validation.warnings.map(warn => `Scene ${validation.sceneNumber}: ${warn}`));
    suggestions.push(...validation.suggestions.map(sug => `Scene ${validation.sceneNumber}: ${sug}`));
  });

  // Validate consistency across scenes
  const consistencyValidation = validateSceneConsistency(scenes, videoStyle);
  errors.push(...consistencyValidation.errors);
  warnings.push(...consistencyValidation.warnings);
  suggestions.push(...consistencyValidation.suggestions);

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    suggestions
  };
}

/**
 * Validate a single scene
 */
export function validateSingleScene(
  scene: EnhancedSceneParameters,
  videoStyle: string
): SceneValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const suggestions: string[] = [];
  const fixes: Partial<EnhancedSceneParameters> = {};

  // Validate required fields
  const requiredFields = [
    'environment', 'lighting', 'cameraSetup', 'cameraMovement',
    'visualStyle', 'colorGrading', 'productAction', 'productPlacement',
    'action', 'audio', 'handAccuracy'
  ];

  requiredFields.forEach(field => {
    if (!scene[field as keyof EnhancedSceneParameters] || 
        String(scene[field as keyof EnhancedSceneParameters]).trim() === '') {
      errors.push(`Missing required field: ${field}`);
    }
  });

  // All scenes are fixed at 8 seconds for Veo3 - no validation needed

  // Validate style compliance
  const styleData = ENHANCED_VIDEO_STYLES[videoStyle];
  if (styleData) {
    // Check lighting preferences
    if (scene.lighting && !styleData.preferences.lighting.includes(scene.lighting)) {
      if (styleData.avoid?.lighting?.includes(scene.lighting)) {
        errors.push(`Lighting "${scene.lighting}" is avoided by ${videoStyle} style`);
      } else {
        warnings.push(`Lighting "${scene.lighting}" not in style preferences`);
        suggestions.push(`Consider using: ${styleData.preferences.lighting.join(', ')}`);
      }
    }

    // Check camera preferences
    if (scene.cameraSetup && !styleData.preferences.camera.includes(scene.cameraSetup)) {
      warnings.push(`Camera setup "${scene.cameraSetup}" not in style preferences`);
      suggestions.push(`Consider using: ${styleData.preferences.camera.join(', ')}`);
    }

    // Check movement preferences
    if (scene.cameraMovement && !styleData.preferences.movement.includes(scene.cameraMovement)) {
      if (styleData.avoid?.movement?.includes(scene.cameraMovement)) {
        errors.push(`Camera movement "${scene.cameraMovement}" is avoided by ${videoStyle} style`);
      } else {
        warnings.push(`Camera movement "${scene.cameraMovement}" not in style preferences`);
        suggestions.push(`Consider using: ${styleData.preferences.movement.join(', ')}`);
      }
    }

    // Check color grading preferences
    if (scene.colorGrading && !styleData.preferences.colorGrading.includes(scene.colorGrading)) {
      if (styleData.avoid?.colorGrading?.includes(scene.colorGrading)) {
        errors.push(`Color grading "${scene.colorGrading}" is avoided by ${videoStyle} style`);
      } else {
        warnings.push(`Color grading "${scene.colorGrading}" not in style preferences`);
        suggestions.push(`Consider using: ${styleData.preferences.colorGrading.join(', ')}`);
      }
    }
  }

  // Validate technical settings
  if (scene.physicsRealism !== true) {
    warnings.push('Physics realism should be enabled for product videos');
    fixes.physicsRealism = true;
  }

  if (scene.subtitlePrevention !== true) {
    suggestions.push('Consider enabling subtitle prevention for cleaner videos');
    fixes.subtitlePrevention = true;
  }

  return {
    sceneNumber: 1, // Default scene number for validation
    isValid: errors.length === 0,
    errors,
    warnings,
    suggestions,
    fixes: Object.keys(fixes).length > 0 ? fixes : undefined
  };
}

/**
 * Validate consistency across all scenes
 */
export function validateSceneConsistency(
  scenes: EnhancedSceneParameters[],
  videoStyle: string
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const suggestions: string[] = [];

  if (scenes.length === 0) {
    return { isValid: true, errors, warnings, suggestions };
  }

  // Character consistency is now handled in action field - no separate validation needed

  // Check voice consistency
  const voicesUsed = scenes
    .map(scene => scene.voiceCharacteristics)
    .filter(voice => voice && voice.trim() !== '');

  if (voicesUsed.length > 0) {
    const uniqueVoices = Array.from(new Set(voicesUsed));
    if (uniqueVoices.length > 1) {
      errors.push(`Inconsistent voice characteristics across scenes. Found: ${uniqueVoices.join(', ')}`);
    }
  }

  // Check visual style consistency
  const visualStyles = scenes.map(scene => scene.visualStyle);
  const uniqueVisualStyles = Array.from(new Set(visualStyles));
  if (uniqueVisualStyles.length > 1) {
    warnings.push(`Multiple visual styles used: ${uniqueVisualStyles.join(', ')}. Consider using one consistent style.`);
  }

  // Check color grading consistency
  const colorGradings = scenes.map(scene => scene.colorGrading);
  const uniqueColorGradings = Array.from(new Set(colorGradings));
  if (uniqueColorGradings.length > 1) {
    warnings.push(`Multiple color gradings used: ${uniqueColorGradings.join(', ')}. Consider using one consistent grading.`);
  }

  // Scene numbering is now handled by array index - no validation needed

  // Check progression logic
  if (scenes.length >= 2) {
    const firstScene = scenes[0];
    const lastScene = scenes[scenes.length - 1];

    // First scene should introduce the product
    if (!firstScene.action.toLowerCase().includes('introduction') &&
        !firstScene.action.toLowerCase().includes('reveal') &&
        !firstScene.action.toLowerCase().includes('emerge')) {
      suggestions.push('First scene should introduce or reveal the product');
    }

    // Last scene should conclude or showcase
    if (!lastScene.action.toLowerCase().includes('final') &&
        !lastScene.action.toLowerCase().includes('conclusion') &&
        !lastScene.action.toLowerCase().includes('showcase')) {
      suggestions.push('Last scene should provide a final showcase or conclusion');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    suggestions
  };
}

/**
 * Auto-fix common validation issues
 */
export function autoFixScenes(
  scenes: EnhancedSceneParameters[],
  videoStyle: string
): EnhancedSceneParameters[] {
  const styleData = ENHANCED_VIDEO_STYLES[videoStyle];
  
  return scenes.map((scene, index) => {
    const fixedScene = { ...scene };

    // Scene numbering and duration are handled automatically - no fixes needed

    // Fix physics and subtitle settings
    fixedScene.physicsRealism = true;
    fixedScene.subtitlePrevention = true;

    // Apply style preferences for empty fields
    if (styleData) {
      if (!fixedScene.lighting && styleData.preferences.lighting.length > 0) {
        fixedScene.lighting = styleData.preferences.lighting[0];
      }

      if (!fixedScene.cameraSetup && styleData.preferences.camera.length > 0) {
        fixedScene.cameraSetup = styleData.preferences.camera[0];
      }

      if (!fixedScene.cameraMovement && styleData.preferences.movement.length > 0) {
        fixedScene.cameraMovement = styleData.preferences.movement[0];
      }

      if (!fixedScene.colorGrading && styleData.preferences.colorGrading.length > 0) {
        fixedScene.colorGrading = styleData.preferences.colorGrading[0];
      }
    }

    return fixedScene;
  });
}

/**
 * Generate quality score for scenes
 */
export function calculateQualityScore(
  scenes: EnhancedSceneParameters[],
  videoStyle: string
): number {
  if (scenes.length === 0) return 0;

  let totalScore = 0;
  const maxScore = scenes.length * 100;

  scenes.forEach(scene => {
    let sceneScore = 0;

    // Required fields completeness (40 points)
    const requiredFields = [
      'environment', 'lighting', 'cameraSetup', 'cameraMovement',
      'visualStyle', 'colorGrading', 'productAction', 'storyDescription'
    ];

    const filledFields = requiredFields.filter(field => 
      scene[field as keyof EnhancedSceneParameters] && 
      String(scene[field as keyof EnhancedSceneParameters]).trim() !== ''
    );

    sceneScore += (filledFields.length / requiredFields.length) * 40;

    // Style compliance (30 points)
    const styleData = ENHANCED_VIDEO_STYLES[videoStyle];
    if (styleData) {
      let styleScore = 0;
      
      if (styleData.preferences.lighting.includes(scene.lighting)) styleScore += 7.5;
      if (styleData.preferences.camera.includes(scene.cameraSetup)) styleScore += 7.5;
      if (styleData.preferences.movement.includes(scene.cameraMovement)) styleScore += 7.5;
      if (styleData.preferences.colorGrading.includes(scene.colorGrading)) styleScore += 7.5;

      sceneScore += styleScore;
    }

    // Technical correctness (20 points) - duration is always 8 seconds
    sceneScore += 10; // All scenes are 8 seconds by default
    if (scene.physicsRealism === true) sceneScore += 5;
    if (scene.subtitlePrevention === true) sceneScore += 5;

    // Content quality (10 points)
    if (scene.action && scene.action.length > 20) sceneScore += 5;
    if (scene.productAction && scene.productAction.length > 10) sceneScore += 5;

    totalScore += sceneScore;
  });

  return Math.round((totalScore / maxScore) * 100);
} 