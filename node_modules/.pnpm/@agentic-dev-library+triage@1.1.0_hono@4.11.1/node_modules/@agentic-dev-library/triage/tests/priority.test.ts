import { beforeEach, describe, expect, it } from 'vitest';
import { PriorityScorer } from '../src/queue/priority.js';

describe('PriorityScorer', () => {
    let scorer: PriorityScorer;

    beforeEach(() => {
        scorer = new PriorityScorer();
    });

    describe('fromLabels', () => {
        it('should return 1 for critical labels', () => {
            expect(PriorityScorer.fromLabels(['critical'])).toBe(1);
            expect(PriorityScorer.fromLabels(['urgent'])).toBe(1);
            expect(PriorityScorer.fromLabels(['hotfix'])).toBe(1);
            expect(PriorityScorer.fromLabels(['priority/critical'])).toBe(1);
            expect(PriorityScorer.fromLabels(['p0'])).toBe(1);
        });

        it('should return 1 for security labels', () => {
            expect(PriorityScorer.fromLabels(['security'])).toBe(1);
            expect(PriorityScorer.fromLabels(['vulnerability'])).toBe(1);
        });

        it('should return 2 for high priority labels', () => {
            expect(PriorityScorer.fromLabels(['high'])).toBe(2);
            expect(PriorityScorer.fromLabels(['important'])).toBe(2);
            expect(PriorityScorer.fromLabels(['priority/high'])).toBe(2);
            expect(PriorityScorer.fromLabels(['p1'])).toBe(2);
        });

        it('should return 2 for bug/fix labels', () => {
            expect(PriorityScorer.fromLabels(['bug'])).toBe(2);
            expect(PriorityScorer.fromLabels(['fix'])).toBe(2);
        });

        it('should return 3 for low priority labels', () => {
            expect(PriorityScorer.fromLabels(['low'])).toBe(3);
            expect(PriorityScorer.fromLabels(['nice-to-have'])).toBe(3);
            expect(PriorityScorer.fromLabels(['priority/low'])).toBe(3);
            expect(PriorityScorer.fromLabels(['p3'])).toBe(3);
        });

        it('should return 2 for no matching labels', () => {
            expect(PriorityScorer.fromLabels(['feature'])).toBe(2);
            expect(PriorityScorer.fromLabels(['documentation'])).toBe(2);
        });

        it('should be case insensitive', () => {
            expect(PriorityScorer.fromLabels(['CRITICAL'])).toBe(1);
            expect(PriorityScorer.fromLabels(['High'])).toBe(2);
            expect(PriorityScorer.fromLabels(['LOW'])).toBe(3);
        });
    });

    describe('fromType', () => {
        it('should return 1 for critical types', () => {
            expect(PriorityScorer.fromType('security')).toBe(1);
            expect(PriorityScorer.fromType('ci-fix')).toBe(1);
        });

        it('should return 2 for normal types', () => {
            expect(PriorityScorer.fromType('bugfix')).toBe(2);
            expect(PriorityScorer.fromType('feature')).toBe(2);
        });

        it('should return 3 for low priority types', () => {
            expect(PriorityScorer.fromType('docs')).toBe(3);
            expect(PriorityScorer.fromType('chore')).toBe(3);
        });
    });

    describe('score', () => {
        it('should prioritize security type', () => {
            expect(scorer.score({ type: 'security' })).toBe(1);
        });

        it('should prioritize critical labels', () => {
            expect(scorer.score({ labels: ['critical'] })).toBe(1);
        });

        it('should combine type and labels (minimum wins)', () => {
            expect(scorer.score({ type: 'docs', labels: ['critical'] })).toBe(1);
            expect(scorer.score({ type: 'security', labels: ['low'] })).toBe(1);
        });

        it('should lower priority for draft PRs', () => {
            expect(scorer.score({ isDraft: true, type: 'bugfix' })).toBe(3);
        });

        it('should lower priority for PRs with conflicts', () => {
            expect(scorer.score({ hasConflicts: true, type: 'bugfix' })).toBe(3);
        });

        it('should boost priority for old PRs', () => {
            expect(scorer.score({ age: 10, type: 'feature' })).toBe(1);
            expect(scorer.score({ age: 5 })).toBe(2);
        });

        it('should boost priority for reviewed PRs', () => {
            expect(scorer.score({ reviewCount: 3, type: 'feature' })).toBe(1);
            expect(scorer.score({ reviewCount: 1 })).toBe(2);
        });

        it('should handle empty metadata', () => {
            expect(scorer.score({})).toBe(2);
        });

        it('should handle complex scenarios', () => {
            // Old, reviewed security PR
            expect(
                scorer.score({
                    type: 'security',
                    age: 8,
                    reviewCount: 3,
                })
            ).toBe(1);

            // Draft documentation PR
            expect(
                scorer.score({
                    type: 'docs',
                    isDraft: true,
                })
            ).toBe(3);

            // Feature with conflicts
            expect(
                scorer.score({
                    type: 'feature',
                    hasConflicts: true,
                })
            ).toBe(3);
        });
    });
});
