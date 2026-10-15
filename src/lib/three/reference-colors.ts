/** Verified Type02 rendered colours, not screenshot samples or swatch artwork.
 * Source: material-source-001. Legacy keys without a verified mapping fall back
 * to Befun's palette; names alone do not establish a reference correspondence.
 */
export const REFERENCE_COLORS: Record<string, { referenceId: number; base: string; edge: string }> = {
  'S_Pistachio Green': {referenceId:4,base:'#A2A596',edge:'#A2A596'},
  'S_Deep Plum': {referenceId:16,base:'#67132C',edge:'#67132C'},
  S_White: { referenceId:0, base:'#F5F5F5', edge:'#F5F5F5' },
  'S_Matte Black': { referenceId:6, base:'#2A2A2C', edge:'#2A2A2C' },
  S_Cotton: { referenceId:9, base:'#D8D2C1', edge:'#D8D2C1' },
  'S_Stone Gray': { referenceId:17, base:'#B2AEA7', edge:'#B2AEA7' },
  'S_Butter Yellow': { referenceId:21, base:'#D9CAA3', edge:'#D9CAA3' },
  'S_Sage Green': { referenceId:16, base:'#C1CCC4', edge:'#C1CCC4' },
  'S_Reisinger Pink': { referenceId:15, base:'#EBACB6', edge:'#EBACB6' },
  S_Lilac: { referenceId:14, base:'#C6C4CC', edge:'#C6C4CC' },
  'S_Dark Brown': { referenceId:22, base:'#45261C', edge:'#45261C' },
  S_Black: { referenceId:19, base:'#1F1F1E', edge:'#1F1F1E' },
  'S_Midnight Blue': { referenceId:2, base:'#101323', edge:'#101323' },
  S_Burgundy: { referenceId:8, base:'#4C1414', edge:'#4C1414' },
  S_Teracotta: { referenceId:1, base:'#954227', edge:'#954227' },
  'S_Teracotta Orange': { referenceId:1, base:'#954227', edge:'#954227' },
  S_Gray: { referenceId:10, base:'#B2B2B2', edge:'#B2B2B2' },
  'S_Olive Green': { referenceId:20, base:'#5C6C3C', edge:'#5C6C3C' },
  'S_Sky Blue': { referenceId:7, base:'#96ADC2', edge:'#96ADC2' },
  'Sand+Midnight Blue': { referenceId:3, base:'#D5CABC', edge:'#101323' },
  'Gray+Darkgray': { referenceId:11, base:'#B2B2B2', edge:'#5C5757' },
  'Sand+Mustard': { referenceId:12, base:'#D5CABC', edge:'#B8A871' },
};

/** Type01 laminate faces; exposed plywood edges keep a separate texture.
 * Nine-colour Crow option configuration verified in material-classic-002.
 */
export const REFERENCE_CLASSIC_COLORS: Record<string, string> = {
  C_White:'#F5F5F5', C_Black:'#1F1F1E', C_Gray:'#B2B2B2',
  C_Pink:'#BCA9A2', C_Yellow:'#CCA550',
  // Befun addition requested by the user; no observed Tylko material ID.
  C_Green:'#034A22',
  C_Blue:'#2271B2', 'C_Moss Green':'#6B6C56',
  C_Cashmere:'#B5ADA3', 'C_Clay Brown':'#B57E5B',
};
