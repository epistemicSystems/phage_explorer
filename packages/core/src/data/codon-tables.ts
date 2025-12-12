// Codon adaptation weights for E. coli (normalized to max 1.0)
// Higher = more abundant tRNA = faster translation

export const E_COLI_W_TABLE: Record<string, number> = {
  // Alanine
  GCT: 1.0, GCC: 0.8, GCA: 0.6, GCG: 0.9,
  // Arginine
  CGT: 1.0, CGC: 0.9, CGA: 0.1, CGG: 0.1, AGA: 0.1, AGG: 0.05,
  // Asparagine
  AAT: 0.4, AAC: 1.0,
  // Aspartic acid
  GAT: 1.0, GAC: 0.8,
  // Cysteine
  TGT: 0.6, TGC: 1.0,
  // Glutamine
  CAA: 0.3, CAG: 1.0,
  // Glutamic acid
  GAA: 1.0, GAG: 0.3,
  // Glycine
  GGT: 1.0, GGC: 0.9, GGA: 0.2, GGG: 0.3,
  // Histidine
  CAT: 0.4, CAC: 1.0,
  // Isoleucine
  ATT: 0.6, ATC: 1.0, ATA: 0.05,
  // Leucine
  TTA: 0.2, TTG: 0.2, CTT: 0.2, CTC: 0.3, CTA: 0.05, CTG: 1.0,
  // Lysine
  AAA: 1.0, AAG: 0.3,
  // Methionine
  ATG: 1.0,
  // Phenylalanine
  TTT: 0.5, TTC: 1.0,
  // Proline
  CCT: 0.3, CCC: 0.1, CCA: 0.4, CCG: 1.0,
  // Serine
  TCT: 1.0, TCC: 0.8, TCA: 0.2, TCG: 0.2, AGT: 0.2, AGC: 0.3,
  // Threonine
  ACT: 0.7, ACC: 1.0, ACA: 0.2, ACG: 0.3,
  // Tryptophan
  TGG: 1.0,
  // Tyrosine
  TAT: 0.4, TAC: 1.0,
  // Valine
  GTT: 1.0, GTC: 0.6, GTA: 0.3, GTG: 0.8,
  // Stop (assume fast release)
  TAA: 1.0, TAG: 1.0, TGA: 1.0,
};

export function getCodonRate(codon: string): number {
  return E_COLI_W_TABLE[codon.toUpperCase()] ?? 0.5;
}
