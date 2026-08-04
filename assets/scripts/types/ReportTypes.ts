/** 最终展示给用户的星座匹配报告。 */
export interface ReportData {
    maleId: string;
    femaleId: string;
    score: number;
    level: string;
    type: string;
    summary: string;
    maleAnalysis: string;
    femaleAnalysis: string;
    advantages: string[];
    risks: string[];
    suggestions: string[];
    dimensions: {
        attraction: number;
        communication: number;
        emotion: number;
        life: number;
        future: number;
    };
}
