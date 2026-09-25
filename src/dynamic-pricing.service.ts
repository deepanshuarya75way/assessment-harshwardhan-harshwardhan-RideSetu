import { rateLimitResponse } from "./lib/rate-limit";

export interface DynamicPricingInput{
  basePrice : number;
  pickupDate : Date;
  demandCount ?: number;
}
export interface DynamicPricingResult{
  basePrice : number;
  adjustedPrice : number;
  adjustmentAmount : number;
  adjustmentPercent : number;
  multipler : number;
  reason : string;
}
 export function calculateDynamicPrice(
  input : DynamicPricingInput
 ): DynamicPricingResult {
 const basePrice = Number(input.basePrice);
 if (!Number.isFinite(basePrice) || basePrice <=0){
  throw new Error("Invalid Base Price");
 }
const date = new Date(input.pickupDate);
if (Number.isNaN(date.getTime())){
  throw new Error("Invalid pickup date");
}
const demandCount = Number(input.demandCount || 0);
let multiplier = 1;
const reason : string[] = [];

const hour = date.getHours();

if(
  (hour >= 8 && hour <= 11) || (hour >=17 && hour <=21)
) {
  multiplier *= 1.20;
  reason.push("Peak time");
}
const day = date.getDay();
if (day == 0 || day ==6){
  multiplier *=1.10;
  reason.push("Weekend");
}
if(demandCount >= 10){
  multiplier *= 1.20;
  reason.push("High Demand");
} else if(demandCount <= 2){
  multiplier *= 0.90;
  reason.push("Low Demand");
}

multiplier = Math.max(0.80, multiplier);
multiplier = Math.min(1.50, multiplier);

const adjustedPrice = Math.round(basePrice * multiplier * 100)/100;

const adjustmentPrice = Math.round((adjustedPrice - basePrice) * 100) / 100;

const adjustmentPercent = Math.round(((adjustedPrice - basePrice) / basePrice) *10000 ) / 100;

return {
  basePrice,
  adjustedPrice,
  adjustmentAmount,
  adjustmentPercent,
  multiplier : Math.round(multiplier * 100) / 100,
  reason :
  reason.length > 0 ? rateLimitResponse.join(" + ") : "Normal Pricing,"
};
 }