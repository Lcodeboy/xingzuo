import type { MatchData } from '../types/MatchTypes';
import type {
    ReportData,
    ReportDimensionKey,
    ReportDimensions,
} from '../types/ReportTypes';
import type { ZodiacData } from '../types/ZodiacTypes';

export type ReportTemplateLevel = 'high' | 'medium' | 'low';

export interface ReportLevelTemplate {
    tone: string;
    summary: string[];
    outlook: string[];
}

export interface ReportTypeTemplate {
    description: string;
    focus: string;
}

export interface DimensionTextLevels {
    high: string[];
    medium: string[];
    low: string[];
}

export interface SignTemplates {
    sameSign: string[];
    differentSign: string[];
}

export interface SignDimensionTemplates {
    sameSign: Record<ReportDimensionKey, string[]>;
    differentSign: Record<ReportDimensionKey, string[]>;
}

export interface RelationshipInsightTemplates {
    summary: SignTemplates;
    strongestBond: SignDimensionTemplates;
    biggestChallenge: SignDimensionTemplates;
    firstAction: Record<ReportDimensionKey, string[]>;
}

export interface DetailAnalysisTemplates {
    attractionSource: SignTemplates;
    loveExpression: SignTemplates;
    communicationConflict: SignTemplates;
    datingRhythm: SignTemplates;
    longTermGrowth: SignTemplates;
}

export interface ElementRelationTemplate {
    summary: string;
    bond: string;
    challenge: string;
    growth: string;
    dateBlend: string;
}

export interface CommunicationProfileTemplate {
    keywords: string[];
    style: string;
    risk: string;
    action: string;
}

export interface LoveStyleProfileTemplate {
    keywords: string[];
    expression: string;
    response: string;
    dateIdea: string;
}

export interface TraitProfileTemplates {
    communication: CommunicationProfileTemplate[];
    loveStyle: LoveStyleProfileTemplate[];
    defaultCommunication: CommunicationProfileTemplate;
    defaultLoveStyle: LoveStyleProfileTemplate;
}

export interface ReportFallbackTemplates {
    trait: string;
    weakness: string;
    typeDescription: string;
    typeFocus: string;
    summary: string;
    strongestBond: string;
    biggestChallenge: string;
    firstAction: string;
    attractionSource: string;
    loveExpression: string;
    communicationConflict: string;
    datingRhythm: string;
    longTermGrowth: string;
    elementRelation: ElementRelationTemplate;
}

export interface MatchTextData {
    levels: Record<ReportTemplateLevel, ReportLevelTemplate>;
    types: Record<string, ReportTypeTemplate>;
    dimensionLabels: Record<ReportDimensionKey, string>;
    dimensionTexts: Record<ReportDimensionKey, DimensionTextLevels>;
    relationshipInsights: RelationshipInsightTemplates;
    detailAnalysis: DetailAnalysisTemplates;
    elementRelations: Record<string, ElementRelationTemplate>;
    traitProfiles: TraitProfileTemplates;
    fallbacks: ReportFallbackTemplates;
}

interface RankedDimension {
    key: ReportDimensionKey;
    value: number;
}

interface CompositionContext {
    male: ZodiacData;
    female: ZodiacData;
    match: MatchData;
    dimensions: ReportDimensions;
    strongest: RankedDimension;
    weakest: RankedDimension;
    sameSign: boolean;
    seed: number;
    textData: MatchTextData;
    levelTemplate: ReportLevelTemplate;
    typeTemplate: ReportTypeTemplate;
    elementRelation: ElementRelationTemplate;
    maleCommunication: CommunicationProfileTemplate;
    femaleCommunication: CommunicationProfileTemplate;
    maleLoveStyle: LoveStyleProfileTemplate;
    femaleLoveStyle: LoveStyleProfileTemplate;
}

type TemplateTokens = Readonly<Record<string, string>>;

const DIMENSION_KEYS: readonly ReportDimensionKey[] = [
    'attraction',
    'communication',
    'emotion',
    'life',
    'future',
];

/** 并列最低分时优先选择最适合给出即时行动建议的维度。 */
const CHALLENGE_PRIORITY: readonly ReportDimensionKey[] = [
    'communication',
    'emotion',
    'life',
    'future',
    'attraction',
];

const TRAIT_INDEX: Readonly<Record<ReportDimensionKey, number>> = {
    attraction: 0,
    communication: 2,
    emotion: 1,
    life: 1,
    future: 2,
};

const STRENGTH_INDEX: Readonly<Record<ReportDimensionKey, number>> = {
    attraction: 0,
    communication: 2,
    emotion: 1,
    life: 1,
    future: 1,
};

const WEAKNESS_INDEX: Readonly<Record<ReportDimensionKey, number>> = {
    attraction: 0,
    communication: 0,
    emotion: 1,
    life: 1,
    future: 1,
};

/** 将星座资料、组合分数与 JSON 模板组合成可直接展示的关系报告。 */
export class ReportComposer {
    public compose(
        male: ZodiacData,
        female: ZodiacData,
        match: MatchData,
        textData: MatchTextData,
    ): ReportData {
        const dimensions: ReportDimensions = this.createDimensions(match);
        const strongest: RankedDimension = this.selectStrongest(dimensions);
        const weakest: RankedDimension = this.selectWeakest(dimensions);
        const seed: number = this.createStableSeed(`${male.id}_${female.id}_${match.type}`);
        const levelTemplate: ReportLevelTemplate = textData.levels[
            this.getTemplateLevel(match.score)
        ];
        const typeTemplate: ReportTypeTemplate = textData.types[match.type] ?? {
            description: textData.fallbacks.typeDescription,
            focus: textData.fallbacks.typeFocus,
        };
        const elementRelation: ElementRelationTemplate = this.getElementRelation(
            male,
            female,
            textData,
        );
        const context: CompositionContext = {
            male,
            female,
            match,
            dimensions,
            strongest,
            weakest,
            sameSign: male.id === female.id,
            seed,
            textData,
            levelTemplate,
            typeTemplate,
            elementRelation,
            maleCommunication: this.getCommunicationProfile(male, textData),
            femaleCommunication: this.getCommunicationProfile(female, textData),
            maleLoveStyle: this.getLoveStyleProfile(male, textData),
            femaleLoveStyle: this.getLoveStyleProfile(female, textData),
        };

        return {
            maleId: male.id,
            femaleId: female.id,
            score: match.score,
            level: this.getMatchLevel(match.score),
            type: match.type,
            summary: this.composeSignText(
                textData.relationshipInsights.summary,
                context,
                strongest.key,
                11,
                textData.fallbacks.summary,
            ),
            relationshipInsights: {
                strongestBond: this.composeSignDimensionText(
                    textData.relationshipInsights.strongestBond,
                    strongest.key,
                    context,
                    23,
                    textData.fallbacks.strongestBond,
                ),
                biggestChallenge: this.composeSignDimensionText(
                    textData.relationshipInsights.biggestChallenge,
                    weakest.key,
                    context,
                    37,
                    textData.fallbacks.biggestChallenge,
                ),
                firstAction: this.composeDimensionText(
                    textData.relationshipInsights.firstAction,
                    weakest.key,
                    context,
                    41,
                    textData.fallbacks.firstAction,
                ),
            },
            detailAnalysis: {
                attractionSource: this.composeSignText(
                    textData.detailAnalysis.attractionSource,
                    context,
                    'attraction',
                    53,
                    textData.fallbacks.attractionSource,
                ),
                loveExpression: this.composeSignText(
                    textData.detailAnalysis.loveExpression,
                    context,
                    'emotion',
                    67,
                    textData.fallbacks.loveExpression,
                ),
                communicationConflict: this.composeSignText(
                    textData.detailAnalysis.communicationConflict,
                    context,
                    'communication',
                    79,
                    textData.fallbacks.communicationConflict,
                ),
                datingRhythm: this.composeSignText(
                    textData.detailAnalysis.datingRhythm,
                    context,
                    'life',
                    97,
                    textData.fallbacks.datingRhythm,
                ),
                longTermGrowth: this.composeSignText(
                    textData.detailAnalysis.longTermGrowth,
                    context,
                    'future',
                    109,
                    textData.fallbacks.longTermGrowth,
                ),
            },
            dimensions,
        };
    }

    private composeSignText(
        templates: SignTemplates,
        context: CompositionContext,
        focus: ReportDimensionKey,
        salt: number,
        fallback: string,
    ): string {
        const values: readonly string[] = context.sameSign
            ? templates.sameSign
            : templates.differentSign;
        return this.renderWithFallback(
            this.pickText(values, context.seed + salt),
            fallback,
            this.createTokens(context, focus, salt),
        );
    }

    private composeSignDimensionText(
        templates: SignDimensionTemplates,
        focus: ReportDimensionKey,
        context: CompositionContext,
        salt: number,
        fallback: string,
    ): string {
        const dimensionTemplates: Record<ReportDimensionKey, string[]> = context.sameSign
            ? templates.sameSign
            : templates.differentSign;
        return this.renderWithFallback(
            this.pickText(dimensionTemplates[focus], context.seed + salt),
            fallback,
            this.createTokens(context, focus, salt),
        );
    }

    private composeDimensionText(
        templates: Record<ReportDimensionKey, string[]>,
        focus: ReportDimensionKey,
        context: CompositionContext,
        salt: number,
        fallback: string,
    ): string {
        return this.renderWithFallback(
            this.pickText(templates[focus], context.seed + salt),
            fallback,
            this.createTokens(context, focus, salt),
        );
    }

    private createTokens(
        context: CompositionContext,
        focus: ReportDimensionKey,
        salt: number,
    ): TemplateTokens {
        const {
            male,
            female,
            dimensions,
            strongest,
            weakest,
            textData,
        } = context;
        const malePersonality: string = this.pickTrait(
            male.personality,
            TRAIT_INDEX[focus],
            textData.fallbacks.trait,
        );
        const femalePersonality: string = this.pickTrait(
            female.personality,
            TRAIT_INDEX[focus],
            textData.fallbacks.trait,
        );
        const maleStrength: string = this.pickTrait(
            male.strengths,
            STRENGTH_INDEX[focus],
            textData.fallbacks.trait,
        );
        const femaleStrength: string = this.pickTrait(
            female.strengths,
            STRENGTH_INDEX[focus],
            textData.fallbacks.trait,
        );
        const maleWeakness: string = this.pickTrait(
            male.weaknesses,
            WEAKNESS_INDEX[focus],
            textData.fallbacks.weakness,
        );
        const femaleWeakness: string = this.pickTrait(
            female.weaknesses,
            WEAKNESS_INDEX[focus],
            textData.fallbacks.weakness,
        );
        const dimensionLevel: ReportTemplateLevel = this.getTemplateLevel(dimensions[focus]);
        const dimensionReading: string = this.renderWithFallback(
            this.pickText(
                textData.dimensionTexts[focus][dimensionLevel],
                context.seed + salt + dimensions[focus],
            ),
            textData.fallbacks.summary,
            {
                score: String(dimensions[focus]),
                dimensionLabel: textData.dimensionLabels[focus],
            },
        );

        return {
            maleId: male.id,
            femaleId: female.id,
            maleName: male.name,
            femaleName: female.name,
            name: male.name,
            overallScore: String(context.match.score),
            type: context.match.type,
            typeDescription: context.typeTemplate.description,
            typeFocus: context.typeTemplate.focus,
            levelTone: context.levelTemplate.tone,
            levelSummary: this.pickText(context.levelTemplate.summary, context.seed + salt),
            levelOutlook: this.pickText(context.levelTemplate.outlook, context.seed + salt + 1),
            dimensionLabel: textData.dimensionLabels[focus],
            dimensionScore: String(dimensions[focus]),
            dimensionReading,
            strongestLabel: textData.dimensionLabels[strongest.key],
            strongestScore: String(strongest.value),
            weakestLabel: textData.dimensionLabels[weakest.key],
            weakestScore: String(weakest.value),
            malePersonality,
            femalePersonality,
            sharedPersonality: malePersonality,
            maleStrength,
            femaleStrength,
            sharedStrength: maleStrength,
            maleWeakness,
            femaleWeakness,
            maleCommunicationStyle: context.maleCommunication.style,
            femaleCommunicationStyle: context.femaleCommunication.style,
            maleCommunicationRisk: context.maleCommunication.risk,
            femaleCommunicationRisk: context.femaleCommunication.risk,
            maleCommunicationAction: context.maleCommunication.action,
            femaleCommunicationAction: context.femaleCommunication.action,
            maleLoveExpression: context.maleLoveStyle.expression,
            femaleLoveExpression: context.femaleLoveStyle.expression,
            maleLoveResponse: context.maleLoveStyle.response,
            femaleLoveResponse: context.femaleLoveStyle.response,
            maleDateIdea: context.maleLoveStyle.dateIdea,
            femaleDateIdea: context.femaleLoveStyle.dateIdea,
            elementSummary: context.elementRelation.summary,
            elementBond: context.elementRelation.bond,
            elementChallenge: context.elementRelation.challenge,
            elementGrowth: context.elementRelation.growth,
            elementDateBlend: context.elementRelation.dateBlend,
        };
    }

    private createDimensions(match: MatchData): ReportDimensions {
        return {
            attraction: match.attraction,
            communication: match.communication,
            emotion: match.emotion,
            life: match.life,
            future: match.future,
        };
    }

    private selectStrongest(dimensions: ReportDimensions): RankedDimension {
        let selected: RankedDimension = {
            key: DIMENSION_KEYS[0],
            value: dimensions[DIMENSION_KEYS[0]],
        };

        for (const key of DIMENSION_KEYS.slice(1)) {
            if (dimensions[key] > selected.value) {
                selected = { key, value: dimensions[key] };
            }
        }

        return selected;
    }

    private selectWeakest(dimensions: ReportDimensions): RankedDimension {
        let selected: RankedDimension = {
            key: CHALLENGE_PRIORITY[0],
            value: dimensions[CHALLENGE_PRIORITY[0]],
        };

        for (const key of CHALLENGE_PRIORITY.slice(1)) {
            if (dimensions[key] < selected.value) {
                selected = { key, value: dimensions[key] };
            }
        }

        return selected;
    }

    private getCommunicationProfile(
        zodiac: ZodiacData,
        textData: MatchTextData,
    ): CommunicationProfileTemplate {
        const source: string = [
            zodiac.communication,
            ...zodiac.personality,
            ...zodiac.weaknesses,
        ].join(' ');
        return textData.traitProfiles.communication.find((profile) => {
            return profile.keywords.some((keyword) => source.includes(keyword));
        }) ?? textData.traitProfiles.defaultCommunication;
    }

    private getLoveStyleProfile(
        zodiac: ZodiacData,
        textData: MatchTextData,
    ): LoveStyleProfileTemplate {
        const source: string = [
            zodiac.loveStyle,
            ...zodiac.personality,
            ...zodiac.strengths,
        ].join(' ');
        return textData.traitProfiles.loveStyle.find((profile) => {
            return profile.keywords.some((keyword) => source.includes(keyword));
        }) ?? textData.traitProfiles.defaultLoveStyle;
    }

    private getElementRelation(
        male: ZodiacData,
        female: ZodiacData,
        textData: MatchTextData,
    ): ElementRelationTemplate {
        const key: string = [male.element, female.element].sort().join('_');
        return textData.elementRelations[key] ?? textData.fallbacks.elementRelation;
    }

    private pickTrait(values: readonly string[], index: number, fallback: string): string {
        if (values.length === 0) {
            return fallback;
        }
        return values[index % values.length] ?? fallback;
    }

    private getMatchLevel(score: number): string {
        if (score >= 90) {
            return '高度合拍';
        }
        if (score >= 80) {
            return '很有默契';
        }
        if (score >= 70) {
            return '值得靠近';
        }
        if (score >= 60) {
            return '慢热磨合';
        }
        return '需要耐心';
    }

    private getTemplateLevel(score: number): ReportTemplateLevel {
        if (score >= 80) {
            return 'high';
        }
        if (score >= 60) {
            return 'medium';
        }
        return 'low';
    }

    private pickText(values: readonly string[], seed: number): string {
        if (values.length === 0) {
            return '';
        }
        return values[seed % values.length] ?? '';
    }

    private renderWithFallback(
        template: string,
        fallback: string,
        tokens: TemplateTokens,
    ): string {
        const rendered: string = this.renderTemplate(template, tokens);
        if (rendered.length > 0) {
            return rendered;
        }
        return this.renderTemplate(fallback, tokens);
    }

    private renderTemplate(template: string, tokens: TemplateTokens): string {
        let missingToken: boolean = false;
        const rendered: string = template.replace(
            /\{([a-zA-Z0-9]+)\}/g,
            (_placeholder: string, key: string): string => {
                const value: string | undefined = tokens[key];
                if (value === undefined) {
                    missingToken = true;
                    return '';
                }
                return value;
            },
        );

        if (missingToken) {
            return '';
        }

        return rendered
            .replace(/\s+/g, ' ')
            .replace(/。{2,}/g, '。')
            .trim();
    }

    private createStableSeed(value: string): number {
        let seed: number = 0;
        for (let index: number = 0; index < value.length; index += 1) {
            seed = (seed * 31 + value.charCodeAt(index)) >>> 0;
        }
        return seed;
    }
}

export function isMatchTextData(value: unknown): value is MatchTextData {
    if (!isRecord(value)) {
        return false;
    }

    return isLevelMap(value.levels)
        && isTypeMap(value.types)
        && isDimensionLabelMap(value.dimensionLabels)
        && isDimensionTextMap(value.dimensionTexts)
        && isRelationshipInsightTemplates(value.relationshipInsights)
        && isDetailAnalysisTemplates(value.detailAnalysis)
        && isElementRelationMap(value.elementRelations)
        && isTraitProfileTemplates(value.traitProfiles)
        && isReportFallbackTemplates(value.fallbacks);
}

function isLevelMap(value: unknown): value is Record<ReportTemplateLevel, ReportLevelTemplate> {
    if (!isRecord(value)) {
        return false;
    }
    return isReportLevelTemplate(value.high)
        && isReportLevelTemplate(value.medium)
        && isReportLevelTemplate(value.low);
}

function isReportLevelTemplate(value: unknown): value is ReportLevelTemplate {
    if (!isRecord(value)) {
        return false;
    }
    return isNonEmptyString(value.tone)
        && isNonEmptyStringArray(value.summary)
        && isNonEmptyStringArray(value.outlook);
}

function isTypeMap(value: unknown): value is Record<string, ReportTypeTemplate> {
    return isRecord(value)
        && Object.keys(value).length > 0
        && Object.values(value).every((item) => {
            return isRecord(item)
                && isNonEmptyString(item.description)
                && isNonEmptyString(item.focus);
        });
}

function isDimensionLabelMap(
    value: unknown,
): value is Record<ReportDimensionKey, string> {
    return isRecord(value)
        && DIMENSION_KEYS.every((key) => isNonEmptyString(value[key]));
}

function isDimensionTextMap(
    value: unknown,
): value is Record<ReportDimensionKey, DimensionTextLevels> {
    return isRecord(value)
        && DIMENSION_KEYS.every((key) => isDimensionTextLevels(value[key]));
}

function isDimensionTextLevels(value: unknown): value is DimensionTextLevels {
    return isRecord(value)
        && isNonEmptyStringArray(value.high)
        && isNonEmptyStringArray(value.medium)
        && isNonEmptyStringArray(value.low);
}

function isRelationshipInsightTemplates(
    value: unknown,
): value is RelationshipInsightTemplates {
    return isRecord(value)
        && isSignTemplates(value.summary)
        && isSignDimensionTemplates(value.strongestBond)
        && isSignDimensionTemplates(value.biggestChallenge)
        && isDimensionStringArrayMap(value.firstAction);
}

function isDetailAnalysisTemplates(value: unknown): value is DetailAnalysisTemplates {
    return isRecord(value)
        && isSignTemplates(value.attractionSource)
        && isSignTemplates(value.loveExpression)
        && isSignTemplates(value.communicationConflict)
        && isSignTemplates(value.datingRhythm)
        && isSignTemplates(value.longTermGrowth);
}

function isSignTemplates(value: unknown): value is SignTemplates {
    return isRecord(value)
        && isNonEmptyStringArray(value.sameSign)
        && isNonEmptyStringArray(value.differentSign);
}

function isSignDimensionTemplates(value: unknown): value is SignDimensionTemplates {
    return isRecord(value)
        && isDimensionStringArrayMap(value.sameSign)
        && isDimensionStringArrayMap(value.differentSign);
}

function isDimensionStringArrayMap(
    value: unknown,
): value is Record<ReportDimensionKey, string[]> {
    return isRecord(value)
        && DIMENSION_KEYS.every((key) => isNonEmptyStringArray(value[key]));
}

function isElementRelationMap(
    value: unknown,
): value is Record<string, ElementRelationTemplate> {
    return isRecord(value)
        && Object.keys(value).length > 0
        && Object.values(value).every((item) => isElementRelationTemplate(item));
}

function isElementRelationTemplate(value: unknown): value is ElementRelationTemplate {
    return isRecord(value)
        && isNonEmptyString(value.summary)
        && isNonEmptyString(value.bond)
        && isNonEmptyString(value.challenge)
        && isNonEmptyString(value.growth)
        && isNonEmptyString(value.dateBlend);
}

function isTraitProfileTemplates(value: unknown): value is TraitProfileTemplates {
    return isRecord(value)
        && Array.isArray(value.communication)
        && value.communication.length > 0
        && value.communication.every((item) => isCommunicationProfile(item))
        && Array.isArray(value.loveStyle)
        && value.loveStyle.length > 0
        && value.loveStyle.every((item) => isLoveStyleProfile(item))
        && isCommunicationProfile(value.defaultCommunication)
        && isLoveStyleProfile(value.defaultLoveStyle);
}

function isCommunicationProfile(value: unknown): value is CommunicationProfileTemplate {
    return isRecord(value)
        && isNonEmptyStringArray(value.keywords)
        && isNonEmptyString(value.style)
        && isNonEmptyString(value.risk)
        && isNonEmptyString(value.action);
}

function isLoveStyleProfile(value: unknown): value is LoveStyleProfileTemplate {
    return isRecord(value)
        && isNonEmptyStringArray(value.keywords)
        && isNonEmptyString(value.expression)
        && isNonEmptyString(value.response)
        && isNonEmptyString(value.dateIdea);
}

function isReportFallbackTemplates(value: unknown): value is ReportFallbackTemplates {
    return isRecord(value)
        && isNonEmptyString(value.trait)
        && isNonEmptyString(value.weakness)
        && isNonEmptyString(value.typeDescription)
        && isNonEmptyString(value.typeFocus)
        && isNonEmptyString(value.summary)
        && isNonEmptyString(value.strongestBond)
        && isNonEmptyString(value.biggestChallenge)
        && isNonEmptyString(value.firstAction)
        && isNonEmptyString(value.attractionSource)
        && isNonEmptyString(value.loveExpression)
        && isNonEmptyString(value.communicationConflict)
        && isNonEmptyString(value.datingRhythm)
        && isNonEmptyString(value.longTermGrowth)
        && isElementRelationTemplate(value.elementRelation);
}

function isNonEmptyStringArray(value: unknown): value is string[] {
    return Array.isArray(value)
        && value.length > 0
        && value.every((item) => isNonEmptyString(item));
}

function isNonEmptyString(value: unknown): value is string {
    return typeof value === 'string' && value.trim().length > 0;
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}
