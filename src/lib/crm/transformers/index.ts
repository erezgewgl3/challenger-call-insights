// CRM Transformer exports
export { UniversalCRMTransformer } from './universal-transformer';
export { ZohoCRMTransformer } from './zoho-transformer';
export { SalesforceCRMTransformer } from './salesforce-transformer';
export { HubSpotCRMTransformer } from './hubspot-transformer';
export { PipedriveCRMTransformer } from './pipedrive-transformer';

// Import the transformer classes for the factory function
import { ZohoCRMTransformer } from './zoho-transformer';
import { SalesforceCRMTransformer } from './salesforce-transformer';
import { HubSpotCRMTransformer } from './hubspot-transformer';
import { PipedriveCRMTransformer } from './pipedrive-transformer';

export type { 
  CRMAnalysisData, 
  CRMDeal, 
  CRMTask, 
  CRMNote, 
  CRMTransformationResult,
  ContactMatch
} from './universal-transformer';

// Factory function to create appropriate transformer
export function createCRMTransformer(crmType: string) {
  switch (crmType.toLowerCase()) {
    case 'zoho':
      return new ZohoCRMTransformer();
    case 'salesforce':
      return new SalesforceCRMTransformer();
    case 'hubspot':
      return new HubSpotCRMTransformer();
    case 'pipedrive':
      return new PipedriveCRMTransformer();
    default:
      throw new Error(`Unsupported CRM type: ${crmType}`);
  }
}