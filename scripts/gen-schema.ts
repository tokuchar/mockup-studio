// Generuje mockup.schema.json ze schematu zod (walidacja w IDE + kontekst dla LLM).
// Przykładowy YAML w examples/ jest generowany z exampleMockup(), żeby był zawsze zgodny.
import { writeFileSync } from 'node:fs';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { Mockup } from '../src/model/schema';
import { exampleMockup } from '../src/model/defaults';
import { toYaml } from '../src/io/yaml';

writeFileSync('mockup.schema.json', JSON.stringify(zodToJsonSchema(Mockup, 'Mockup'), null, 2) + '\n');
writeFileSync('examples/wniosek-kredytowy.mockup.yaml', toYaml(exampleMockup()));
console.log('mockup.schema.json + examples/wniosek-kredytowy.mockup.yaml');
