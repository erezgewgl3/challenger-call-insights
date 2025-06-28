
export interface ChallengerScores {
  teaching: number;
  tailoring: number;
  control: number;
}

export interface AnalysisInsight {
  score: number;
  insights: string[];
  improvements: string[];
}

export interface KeyMoment {
  timestamp: string;
  type: 'teaching' | 'tailoring' | 'control';
  description: string;
  impact: 'positive' | 'improvement';
}

export interface AnalysisData {
  overallScore: number;
  teaching: AnalysisInsight;
  tailoring: AnalysisInsight;
  control: AnalysisInsight;
}

export const mockAnalysisService = {
  getAnalysisData(): AnalysisData {
    return {
      overallScore: 84,
      teaching: {
        score: 88,
        insights: [
          "Effectively identified customer's unknown problem with current workflow",
          "Provided industry benchmarks and statistics to support arguments",
          "Shared relevant case study from similar company"
        ],
        improvements: [
          "Could have introduced more provocative insights earlier in the conversation",
          "Missed opportunity to challenge assumption about budget constraints"
        ]
      },
      tailoring: {
        score: 79,
        insights: [
          "Adapted message well for technical vs business stakeholders",
          "Referenced customer's specific industry challenges",
          "Customized solution benefits to their use case"
        ],
        improvements: [
          "Could have better personalized the economic impact discussion",
          "Missed opportunity to address specific organizational pain points"
        ]
      },
      control: {
        score: 86,
        insights: [
          "Maintained conversation flow and guided toward next steps",
          "Successfully addressed objections with confidence",
          "Set clear expectations for follow-up activities"
        ],
        improvements: [
          "Could have been more assertive about timeline commitments",
          "Opportunity to push back more on unrealistic requirements"
        ]
      }
    };
  },

  getKeyMoments(): KeyMoment[] {
    return [
      {
        timestamp: "05:32",
        type: "teaching",
        description: "Introduced industry insight about automation ROI",
        impact: "positive"
      },
      {
        timestamp: "12:18",
        type: "tailoring",
        description: "Customized demo for their specific workflow",
        impact: "positive"
      },
      {
        timestamp: "18:45",
        type: "control",
        description: "Successfully redirected pricing discussion",
        impact: "positive"
      },
      {
        timestamp: "23:12",
        type: "teaching",
        description: "Missed opportunity to challenge their timeline assumptions",
        impact: "improvement"
      }
    ];
  }
};
