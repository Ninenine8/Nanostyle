import { ImageAsset } from './types';

// Using pollinations.ai to generate consistent full-body placeholders
// mirroring the user's requirement for "full body" and "face looking forward".
// Updated dimensions to 768x1365 (approx 9:16) for perfect vertical full-body aspect ratio.

export const PRESET_PERSONS: ImageAsset[] = [
  { id: 'p1', url: 'https://image.pollinations.ai/prompt/full%20body%20portrait%20photo%20of%20a%20beautiful%20woman%20model%20standing%20facing%20forward%20looking%20at%20camera%20white%20studio%20background%20fashion%20photography%20showing%20shoes?width=768&height=1365&seed=101&nologo=true', type: 'person' },
  { id: 'p2', url: 'https://image.pollinations.ai/prompt/full%20body%20portrait%20photo%20of%20a%20handsome%20man%20model%20standing%20facing%20forward%20looking%20at%20camera%20white%20studio%20background%20fashion%20photography%20showing%20shoes?width=768&height=1365&seed=102&nologo=true', type: 'person' },
  { id: 'p3', url: 'https://image.pollinations.ai/prompt/full%20body%20shot%20of%20a%20young%20fashion%20model%20wearing%20neutral%20clothing%20facing%20forward%20simple%20background%20showing%20entire%20body?width=768&height=1365&seed=103&nologo=true', type: 'person' },
  { id: 'p4', url: 'https://image.pollinations.ai/prompt/full%20body%20photo%20of%20a%20diverse%20male%20model%20standing%20straight%20facing%20camera%20studio%20lighting%20entire%20body%20visible?width=768&height=1365&seed=104&nologo=true', type: 'person' },
];

export const PRESET_GARMENTS: ImageAsset[] = [
  { id: 'g1', url: 'https://image.pollinations.ai/prompt/elegant%20red%20floral%20summer%20dress%20isolated%20on%20white%20background%20ghost%20mannequin%20style%20full%20length%20clothing%20item?width=768&height=1024&seed=201&nologo=true', type: 'garment' },
  { id: 'g2', url: 'https://image.pollinations.ai/prompt/blue%20denim%20jacket%20and%20black%20jeans%20outfit%20isolated%20on%20white%20background%20fashion%20flat%20lay%20clothing?width=768&height=1024&seed=202&nologo=true', type: 'garment' },
  { id: 'g3', url: 'https://image.pollinations.ai/prompt/streetwear%20hoodie%20and%20joggers%20clothing%20set%20flat%20lay%20white%20background%20isolated%20outfit?width=768&height=1024&seed=203&nologo=true', type: 'garment' },
  { id: 'g4', url: 'https://image.pollinations.ai/prompt/professional%20beige%20blazer%20and%20trousers%20suit%20for%20women%20isolated%20on%20white%20background%20ghost%20mannequin%20outfit?width=768&height=1024&seed=204&nologo=true', type: 'garment' },
];