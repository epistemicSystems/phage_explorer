// NCBI E-utilities fetcher for phage sequences
// API documentation: https://www.ncbi.nlm.nih.gov/books/NBK25499/

const NCBI_BASE_URL = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils';
const RATE_LIMIT_MS = 350; // ~3 requests per second without API key

export interface NCBISequenceResult {
  accession: string;
  sequence: string;
  length: number;
  gcContent: number;
  features: NCBIFeature[];
  metadata: Record<string, string>;
}

export interface NCBIFeature {
  type: string;
  start: number;
  end: number;
  strand: '+' | '-';
  gene?: string;
  locusTag?: string;
  product?: string;
  qualifiers: Record<string, string>;
}

// Sleep helper for rate limiting
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Fetch sequence in FASTA format
export async function fetchFasta(accession: string): Promise<string> {
  const url = `${NCBI_BASE_URL}/efetch.fcgi?db=nuccore&id=${accession}&rettype=fasta&retmode=text`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch FASTA for ${accession}: ${response.status}`);
  }

  const text = await response.text();
  await sleep(RATE_LIMIT_MS);

  return text;
}

// Fetch sequence in GenBank format (includes features)
export async function fetchGenBank(accession: string): Promise<string> {
  const url = `${NCBI_BASE_URL}/efetch.fcgi?db=nuccore&id=${accession}&rettype=gbwithparts&retmode=text`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch GenBank for ${accession}: ${response.status}`);
  }

  const text = await response.text();
  await sleep(RATE_LIMIT_MS);

  return text;
}

// Parse FASTA format to extract sequence
export function parseFasta(fasta: string): { header: string; sequence: string } {
  const lines = fasta.trim().split('\n');
  const header = lines[0].replace(/^>/, '').trim();
  const sequence = lines.slice(1).join('').replace(/\s/g, '').toUpperCase();

  return { header, sequence };
}

// Parse GenBank format to extract sequence and features
export function parseGenBank(genbank: string): NCBISequenceResult {
  const lines = genbank.split('\n');
  let accession = '';
  let sequence = '';
  const features: NCBIFeature[] = [];
  const metadata: Record<string, string> = {};

  let inSequence = false;
  let inFeatures = false;
  let currentFeature: Partial<NCBIFeature> | null = null;
  let currentQualifierKey = '';
  let currentQualifierValue = '';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Parse accession
    if (line.startsWith('ACCESSION')) {
      accession = line.replace('ACCESSION', '').trim().split(/\s+/)[0];
    }

    // Parse definition
    if (line.startsWith('DEFINITION')) {
      metadata['definition'] = line.replace('DEFINITION', '').trim();
    }

    // Parse organism
    if (line.startsWith('  ORGANISM')) {
      metadata['organism'] = line.replace('  ORGANISM', '').trim();
    }

    // Feature section
    if (line.startsWith('FEATURES')) {
      inFeatures = true;
      continue;
    }

    // Sequence section
    if (line.startsWith('ORIGIN')) {
      inFeatures = false;
      inSequence = true;
      if (currentFeature && currentFeature.type) {
        // Save pending qualifier for the last feature
        if (currentQualifierKey && currentQualifierValue) {
          currentFeature.qualifiers![currentQualifierKey] = currentQualifierValue.replace(/^"|"$/g, '');
        }
        features.push(currentFeature as NCBIFeature);
      }
      continue;
    }

    // End of record
    if (line.startsWith('//')) {
      break;
    }

    // Parse features
    if (inFeatures) {
      // New feature (starts at column 5)
      if (line.length > 5 && line[5] !== ' ' && !line.startsWith('FEATURES')) {
        // Save previous feature
        if (currentFeature && currentFeature.type) {
          if (currentQualifierKey && currentQualifierValue) {
            currentFeature.qualifiers![currentQualifierKey] = currentQualifierValue.replace(/^"|"$/g, '');
          }
          features.push(currentFeature as NCBIFeature);
        }

        // Parse new feature line
        const featurePart = line.substring(5, 21).trim();
        let locationPart = line.substring(21).trim();

        // Handle multi-line locations
        let nextLineIdx = i + 1;
        while (nextLineIdx < lines.length) {
          const nextLine = lines[nextLineIdx];
          // Check if it's a continuation line (starts with spaces, no '/')
          // It must NOT be a qualifier (start with /) and must NOT be a new feature (start at col 5)
          // Location continuations are usually indented to col 21
          if (
            nextLine.match(/^\s{21}/) &&
            !nextLine.trim().startsWith('/') &&
            !nextLine.substring(5, 21).trim()
          ) {
            locationPart += nextLine.trim();
            i++; // Advance main loop
            nextLineIdx++;
          } else {
            break;
          }
        }

        currentFeature = {
          type: featurePart,
          qualifiers: {},
          strand: '+',
          start: 0,
          end: 0,
        };
        currentQualifierKey = '';
        currentQualifierValue = '';

        // Parse location (simplified - handles most common cases)
        parseLocation(locationPart, currentFeature);
      }
      // Qualifier line (starts with /)
      else if (line.includes('/') && currentFeature) {
        // Save previous qualifier
        if (currentQualifierKey && currentQualifierValue) {
          currentFeature.qualifiers![currentQualifierKey] = currentQualifierValue.replace(/^"|"$/g, '');
        }

        const qualMatch = line.match(/\/(\w+)(?:=(.*))?/);
        if (qualMatch) {
          currentQualifierKey = qualMatch[1];
          currentQualifierValue = qualMatch[2] || '';

          // Special handling for common qualifiers
          if (currentQualifierKey === 'gene') {
            currentFeature.gene = currentQualifierValue.replace(/^"|"$/g, '');
          } else if (currentQualifierKey === 'locus_tag') {
            currentFeature.locusTag = currentQualifierValue.replace(/^"|"$/g, '');
          } else if (currentQualifierKey === 'product') {
            currentFeature.product = currentQualifierValue.replace(/^"|"$/g, '');
          }
        }
      }
      // Continuation of qualifier value
      else if (line.match(/^\s{21}/) && currentQualifierKey) {
        currentQualifierValue += line.trim();
      }
    }

    // Parse sequence
    if (inSequence && line.match(/^\s*\d+/)) {
      sequence += line.replace(/[\d\s\/]/g, '').toUpperCase();
    }
  }

  // Calculate GC content
  let gc = 0;
  let total = 0;
  for (const c of sequence) {
    if (c === 'G' || c === 'C') gc++;
    if (c === 'A' || c === 'T' || c === 'G' || c === 'C') total++;
  }
  const gcContent = total > 0 ? (gc / total) * 100 : 0;

  return {
    accession,
    sequence,
    length: sequence.length,
    gcContent,
    features: features.filter(f => f.type === 'CDS' || f.type === 'gene'),
    metadata,
  };
}

// Parse feature location string to find total extent (min start, max end)
function parseLocation(location: string, feature: Partial<NCBIFeature>): void {
  // Remove accession references (e.g., "NC_001234.1:") to avoid parsing version numbers as coordinates
  // Also remove simple accessions "J02459:"
  const localLocation = location.replace(/[a-zA-Z][a-zA-Z0-9_.]*:/g, '');

  // Extract all integers from the cleaned location string
  const numbers = localLocation.match(/\d+/g)?.map(n => parseInt(n, 10));
  
  if (!numbers || numbers.length === 0) {
    return;
  }

  // GenBank is 1-based, we want 0-based
  // Find min and max coordinates
  const min = Math.min(...numbers);
  const max = Math.max(...numbers);

  feature.start = Math.max(0, min - 1);
  feature.end = max;

  // Determine strand based on presence of 'complement'
  if (location.includes('complement(')) {
    feature.strand = '-';
  } else {
    feature.strand = '+';
  }
}

// Fetch and parse a complete phage sequence with features
export async function fetchPhageSequence(accession: string): Promise<NCBISequenceResult> {
  console.log(`Fetching GenBank record for ${accession}...`);
  const genbank = await fetchGenBank(accession);
  return parseGenBank(genbank);
}

// Batch fetch multiple sequences with rate limiting
export async function fetchPhageSequences(
  accessions: string[],
  onProgress?: (current: number, total: number) => void
): Promise<Map<string, NCBISequenceResult | null>> {
  const results = new Map<string, NCBISequenceResult | null>();

  for (let i = 0; i < accessions.length; i++) {
    const accession = accessions[i];
    try {
      const result = await fetchPhageSequence(accession);
      results.set(accession, result);
    } catch (error) {
      console.error(`Failed to fetch ${accession}:`, error);
      results.set(accession, null); // Mark as failed
    }
    onProgress?.(i + 1, accessions.length);
  }

  return results;
}
