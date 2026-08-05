/** 报告使用的五个关系维度。 */
export interface ReportDimensions {
    attraction: number;
    communication: number;
    emotion: number;
    life: number;
    future: number;
}

export type ReportDimensionKey = keyof ReportDimensions;

/** 结果页上供用户快速阅读的三个关系结论。 */
export interface RelationshipInsights {
    strongestBond: string;
    biggestChallenge: string;
    firstAction: string;
}

/** 完整报告中的五段关系叙事。 */
export interface DetailAnalysis {
    attractionSource: string;
    loveExpression: string;
    communicationConflict: string;
    datingRhythm: string;
    longTermGrowth: string;
}

/** 最终展示给用户的星座匹配报告。 */
export interface ReportData {
    maleId: string;
    femaleId: string;
    score: number;
    level: string;
    type: string;
    summary: string;
    relationshipInsights: RelationshipInsights;
    detailAnalysis: DetailAnalysis;
    dimensions: ReportDimensions;
}
