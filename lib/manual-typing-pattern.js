"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.manualTypingPatternService = void 0;
class ManualTypingPatternService {
    /**
     * Generate a typing pattern from keystroke data
     */
    generatePattern(keystrokes, text) {
        if (keystrokes.length < 10) {
            throw new Error('Need at least 10 keystrokes for pattern analysis');
        }
        // Calculate timing intervals between keystrokes
        const intervals = [];
        for (let i = 1; i < keystrokes.length; i++) {
            intervals.push(keystrokes[i].timestamp - keystrokes[i - 1].timestamp);
        }
        // Calculate average typing speed
        const averageSpeed = intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length;
        // Calculate variance (consistency measure)
        const variance = intervals.reduce((sum, interval) => {
            const diff = interval - averageSpeed;
            return sum + (diff * diff);
        }, 0) / intervals.length;
        // Create a pattern hash based on timing patterns
        const patternHash = this.createPatternHash(keystrokes, intervals);
        return {
            keystrokes,
            text,
            averageSpeed,
            variance,
            patternHash
        };
    }
    /**
     * Compare two typing patterns and determine if they match
     */
    comparePatterns(pattern1, pattern2) {
        // First, check if patterns are similar in length (within 20% difference)
        const lengthDiff = Math.abs(pattern1.keystrokes.length - pattern2.keystrokes.length);
        const avgLength = (pattern1.keystrokes.length + pattern2.keystrokes.length) / 2;
        const lengthSimilarity = Math.max(0, 1 - (lengthDiff / avgLength));
        // If length difference is too large, reject immediately
        if (lengthSimilarity < 0.6) {
            console.log('=== PATTERN COMPARISON DEBUG ===');
            console.log('Pattern lengths too different:', {
                pattern1Length: pattern1.keystrokes.length,
                pattern2Length: pattern2.keystrokes.length,
                lengthSimilarity,
                threshold: 0.6
            });
            return {
                isMatch: false,
                confidence: lengthSimilarity,
                score: lengthSimilarity,
                message: 'Typing patterns are too different in length'
            };
        }
        const textSimilarity = this.calculateTextSimilarity(pattern1.text, pattern2.text);
        // Compare timing patterns with stricter requirements
        const timingScore = this.compareTimingPatterns(pattern1, pattern2);
        // Compare pattern hashes
        const hashScore = this.comparePatternHashes(pattern1.patternHash, pattern2.patternHash);
        // Calculate overall confidence with stricter weights
        const confidence = (timingScore * 0.5) + (hashScore * 0.3) + (textSimilarity * 0.1) + (lengthSimilarity * 0.1);
        console.log('=== PATTERN COMPARISON DEBUG ===');
        console.log('Length similarity:', lengthSimilarity);
        console.log('Text similarity:', textSimilarity);
        console.log('Timing score:', timingScore);
        console.log('Hash score:', hashScore);
        console.log('Overall confidence:', confidence);
        console.log('Threshold:', 0.5); // Adjusted threshold to 50%
        console.log('Is match:', confidence >= 0.5);
        const isMatch = confidence >= 0.5; // Adjusted threshold to 50%
        return {
            isMatch,
            confidence,
            score: confidence,
            message: isMatch
                ? 'Pattern matches successfully'
                : 'Typing pattern does not match. Please try typing more consistently.'
        };
    }
    /**
     * Create a pattern hash from keystroke data
     */
    createPatternHash(keystrokes, intervals) {
        // Create a simplified pattern based on timing intervals
        const normalizedIntervals = intervals.map(interval => {
            if (interval < 150)
                return 'F'; // Fast (increased threshold)
            if (interval < 400)
                return 'M'; // Medium (increased threshold)
            return 'S'; // Slow
        });
        return normalizedIntervals.join('');
    }
    /**
     * Compare timing patterns between two typing samples
     */
    compareTimingPatterns(pattern1, pattern2) {
        const intervals1 = this.getIntervals(pattern1.keystrokes);
        const intervals2 = this.getIntervals(pattern2.keystrokes);
        // Use the shorter pattern length for comparison
        const minLength = Math.min(intervals1.length, intervals2.length);
        if (minLength < 5) {
            return 0; // Not enough data for comparison
        }
        let totalDifference = 0;
        let significantDifferences = 0;
        for (let i = 0; i < minLength; i++) {
            const diff = Math.abs(intervals1[i] - intervals2[i]);
            totalDifference += diff;
            // Count significant differences (>200ms)
            if (diff > 200) {
                significantDifferences++;
            }
        }
        const averageDifference = totalDifference / minLength;
        const maxExpectedDifference = 300; // Reduced tolerance to 300ms
        // Penalize for too many significant differences
        const significantDifferencePenalty = Math.max(0, 1 - (significantDifferences / minLength));
        // Convert to a score between 0 and 1
        const baseScore = Math.max(0, 1 - (averageDifference / maxExpectedDifference));
        // Apply penalty for significant differences
        const finalScore = baseScore * significantDifferencePenalty;
        console.log('Timing comparison details:', {
            averageDifference,
            significantDifferences,
            significantDifferencePenalty,
            baseScore,
            finalScore
        });
        return finalScore;
    }
    /**
     * Compare pattern hashes
     */
    comparePatternHashes(hash1, hash2) {
        const minLength = Math.min(hash1.length, hash2.length);
        let matches = 0;
        for (let i = 0; i < minLength; i++) {
            if (hash1[i] === hash2[i]) {
                matches++;
            }
        }
        return matches / minLength;
    }
    /**
     * Calculate text similarity
     */
    calculateTextSimilarity(text1, text2) {
        const longer = text1.length > text2.length ? text1 : text2;
        const shorter = text1.length > text2.length ? text2 : text1;
        if (longer.length === 0)
            return 1.0;
        const editDistance = this.levenshteinDistance(longer, shorter);
        return (longer.length - editDistance) / longer.length;
    }
    /**
     * Calculate Levenshtein distance for text similarity
     */
    levenshteinDistance(str1, str2) {
        const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));
        for (let i = 0; i <= str1.length; i++)
            matrix[0][i] = i;
        for (let j = 0; j <= str2.length; j++)
            matrix[j][0] = j;
        for (let j = 1; j <= str2.length; j++) {
            for (let i = 1; i <= str1.length; i++) {
                const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
                matrix[j][i] = Math.min(matrix[j][i - 1] + 1, // deletion
                matrix[j - 1][i] + 1, // insertion
                matrix[j - 1][i - 1] + indicator // substitution
                );
            }
        }
        return matrix[str2.length][str1.length];
    }
    /**
     * Get intervals between keystrokes
     */
    getIntervals(keystrokes) {
        const intervals = [];
        for (let i = 1; i < keystrokes.length; i++) {
            intervals.push(keystrokes[i].timestamp - keystrokes[i - 1].timestamp);
        }
        return intervals;
    }
    /**
     * Validate pattern quality
     */
    validatePatternQuality(pattern) {
        if (pattern.keystrokes.length < 10) {
            return {
                isValid: false,
                quality: 0,
                message: 'Need at least 10 keystrokes for pattern analysis'
            };
        }
        // Calculate average typing speed
        const intervals = this.getIntervals(pattern.keystrokes);
        const averageSpeed = intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length;
        // Check for reasonable typing speed (not too fast, not too slow)
        let speedScore = 1.0;
        if (averageSpeed < 50) {
            speedScore = 0.3; // Too fast
        }
        else if (averageSpeed > 1000) {
            speedScore = 0.5; // Too slow
        }
        else if (averageSpeed >= 100 && averageSpeed <= 500) {
            speedScore = 1.0; // Good speed
        }
        else {
            speedScore = 0.7; // Acceptable speed
        }
        // Check for consistent typing (low variance is better, but some variance is normal)
        const variance = pattern.variance;
        let consistencyScore = 1.0;
        if (variance < 1000) {
            consistencyScore = 0.8; // Too consistent (might be automated)
        }
        else if (variance > 50000) {
            consistencyScore = 0.4; // Too inconsistent
        }
        else if (variance >= 5000 && variance <= 20000) {
            consistencyScore = 1.0; // Good consistency
        }
        else {
            consistencyScore = 0.7; // Acceptable consistency
        }
        // Overall quality score
        const quality = (speedScore * 0.6) + (consistencyScore * 0.4);
        const isValid = quality >= 0.4; // Lowered threshold from 0.3 to 0.4
        let message = '';
        if (isValid) {
            message = `Pattern quality: ${(quality * 100).toFixed(1)}%`;
        }
        else {
            if (speedScore < 0.5) {
                message = 'Please type at a more natural speed (not too fast or too slow)';
            }
            else if (consistencyScore < 0.5) {
                message = 'Please type more consistently. Try to maintain a steady rhythm.';
            }
            else {
                message = 'Pattern quality too low. Please try typing more naturally and consistently.';
            }
        }
        return {
            isValid,
            quality,
            message
        };
    }
}
exports.manualTypingPatternService = new ManualTypingPatternService();
