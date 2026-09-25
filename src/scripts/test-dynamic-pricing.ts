import{
  calculateDynamicPrice,
} from "../services/dynamic-pricing.service";

function test (
  name : string,
  condition : boolean
) {
  if (condition){
    console.log('PASS : ${name}');
  } else {
    console.error('FAIL : ${name}');
    process.exitCode = 1;
  }
}

const basePrice = 1000;

const normalDate = new Date("2026-09-28T14 :00:00");
  
const normal = calculateDynamicPrice({
  basePrice,
  pickupDate : normalDate,
  demandCount : 5,
});

test("Normal price remains unchanged" , normal.adjustedPrice === 1000);

const weekendDate = new Date("2026-09-26T14:00:00");

const weekend = calculateDynamicPrice({
  basePrice,
  pickupDate : weekendDate,
  demandCount : 5,
});

test(
  "Weekend pricing applied" weekend.adjustedPrice === 1100 
);

const peekDate = new Date("2026-09-28T09 :00:00"):

const peek = calculateDynamicPrice({
  basePrice;
  pickupDate : peekDate,
  demandCount : 5,
});

test ("Peek time priicng applied" , peek.adjustedPrice === 1200);

const highDemand = calculateDynamicPrice({
  basePrice,
  pickupDate : normalDate,
  demandCount : 10,
});

test("High demand pricing applied" , highDemand.adjustedPrice ===1200);


const combined = calculateDynamicPrice({
basePrice,
pickupDate : weekendDate,
demandCount : 10,
});
 
test("Combined Pricing is applied" , combined.adjustedPrice > basePrice);

test("Multiplier is within safe range" , combined.multipler >= 0.8 && combined.multipler <= 1.5);

test("Adjustment amount is Correct" , combined.adjustmentAmount === combined.adjustedPrice - basePrice);

test("Reason is returned" , combined.reason.length > 0);

console.log("\nDynamic Pricing Tests Completed");