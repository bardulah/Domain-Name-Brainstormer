/**
 * Test file for Domain Name Brainstormer
 * Demonstrates the API usage without checking actual availability
 */

const DomainGenerator = require('./domainGenerator');
const { brainstormDomains } = require('./index');

console.log('='.repeat(50));
console.log('Domain Name Brainstormer - Test Suite');
console.log('='.repeat(50));

// Test 1: Domain Generation
console.log('\n📝 Test 1: Domain Name Generation\n');

const generator = new DomainGenerator();
const testDescriptions = [
  'real-time chat application',
  'AI-powered task manager',
  'social network for developers',
  'cloud storage solution',
  'recipe sharing platform'
];

testDescriptions.forEach(description => {
  console.log(`Description: "${description}"`);
  const suggestions = generator.generate(description, { maxSuggestions: 10 });
  console.log(`Generated ${suggestions.length} suggestions:`);
  console.log(`  ${suggestions.slice(0, 5).join(', ')}...`);
  console.log();
});

// Test 2: Keyword Extraction
console.log('\n🔍 Test 2: Keyword Extraction\n');

testDescriptions.forEach(description => {
  const keywords = generator.extractKeywords(description);
  console.log(`"${description}"`);
  console.log(`  Keywords: ${keywords.join(', ')}`);
  console.log();
});

// Test 3: Portmanteau Generation
console.log('\n🔤 Test 3: Portmanteau Generation\n');

const wordPairs = [
  ['social', 'network'],
  ['cloud', 'storage'],
  ['task', 'manager'],
  ['chat', 'application']
];

wordPairs.forEach(([word1, word2]) => {
  const blends = generator.createPortmanteau(word1, word2);
  console.log(`${word1} + ${word2} = ${blends.slice(0, 3).join(', ')}`);
});

// Test 4: Creative Spelling
console.log('\n\n✏️  Test 4: Creative Spelling\n');

const testWords = ['checker', 'monitor', 'creator', 'factor'];
testWords.forEach(word => {
  const variations = generator.applyCreativeSpelling(word);
  if (variations.length > 1) {
    console.log(`${word} → ${variations.join(', ')}`);
  }
});

// Test 5: Full Integration (without actual WHOIS checks)
console.log('\n\n🚀 Test 5: Full Generation Pipeline\n');

const projectDescription = 'productivity tool for remote teams';
console.log(`Project: "${projectDescription}"\n`);

const allSuggestions = generator.generate(projectDescription, { maxSuggestions: 30 });

console.log(`Generated ${allSuggestions.length} domain suggestions:\n`);
console.log('Top 15 suggestions:');
allSuggestions.slice(0, 15).forEach((name, index) => {
  const tlds = ['.com', '.io', '.dev'];
  const domains = tlds.map(tld => name + tld).join(', ');
  console.log(`  ${index + 1}. ${name} (${domains})`);
});

console.log('\n' + '='.repeat(50));
console.log('✅ All tests completed!');
console.log('='.repeat(50));

console.log('\nNote: To test actual domain availability, run:');
console.log('  node cli.js "your project description" --quick');
console.log('\nThis will perform real WHOIS lookups (takes longer).');
