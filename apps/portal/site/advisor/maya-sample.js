import {deriveRecommendations} from './presentation-model.js';

/** Generated from approved Maya public content; no live identity or writable store. */
const approvedPresentation={
  "schemaVersion": 2,
  "title": "Maya’s plan",
  "summary": "We’ll keep the basics that already feel comfortable, pause the extra morning serums and introduce azelaic acid on its own.",
  "preparedBy": "Kanuj",
  "preparedOn": "2026-10-20",
  "sources": [],
  "consultationSections": [
    {
      "title": "What we’re working on",
      "body": "The brown marks that linger after spots are the priority in this plan. We’ll watch for gradual change in the marks while checking how your skin feels."
    },
    {
      "title": "What is already working",
      "body": "Your CeraVe lotion has felt comfortable for months, your cleanser feels comfortable, and Bioderma takes your makeup off comfortably. I’d keep those basics while introducing one treatment."
    },
    {
      "title": "What we’re simplifying",
      "body": "Pilling on some serum mornings has been getting in the way of sunscreen and makeup. I’d pause the separate hyaluronic acid and niacinamide serums so we can see how the simpler routine wears."
    },
    {
      "title": "The first proposed change",
      "body": "Azelaic acid 10% is the one new treatment I’m proposing. When you begin, follow the gradual introduction in your guide and keep cleanser or moisturizer changes separate."
    },
    {
      "title": "What we’re leaving out",
      "body": "You stopped the glycolic toner after your cheeks felt hot and tight, and your basics have felt comfortable again since. I’d leave the toner out while you introduce azelaic acid."
    },
    {
      "title": "What we’ll review together",
      "body": "If you’ve started azelaic acid, we’ll review how you’ve used it, any irritation and whether the marks are changing. If you haven’t, tell me what you’ve noticed with your current routine. Either way, we’ll check how sunscreen and makeup wear without the two extra serums before deciding what earns a place back."
    }
  ],
  "categoryCards": [
    {
      "id": "maya-card-moisturizer",
      "slot": "moisturizer",
      "kind": "optional_alternative",
      "recommendationId": "maya-hydro-1",
      "title": "Moisturizer",
      "subtitle": "",
      "rationaleTitle": "Why I’m keeping this for you",
      "reasons": [
        {
          "title": "Why I’m keeping this for you",
          "body": "Your CeraVe has felt comfortable for months, and your basic routine sits well under makeup. I’d keep that dependable part of your routine while we introduce the treatment. The pilling shows up on some serum mornings, so removing those extra layers is a better first test than assuming your moisturizer needs replacing."
        },
        {
          "title": "Optional alternative",
          "body": "You can consider this Water Cream when your CeraVe runs out if you’d like a different texture. I’d make that a later choice, after the treatment trial, rather than buy another moisturizer now."
        }
      ],
      "actions": [],
      "currentProduct": {
        "id": "cerave-pm",
        "name": "CeraVe PM Facial Moisturizing Lotion",
        "brand": "CeraVe PM",
        "variant": "Facial Moisturizing Lotion",
        "sizeLabel": "3 fl oz",
        "productUrl": "https://www.cerave.com/skincare/moisturizers/pm-facial-moisturizing-lotion",
        "imageUrl": "https://portal.goshelv.com/maya/assets/moisturizer.jpg",
        "reference": "The brand lists ceramides, niacinamide and hyaluronic acid in this facial lotion.",
        "displayPrice": {
          "cents": 1499,
          "currency": "USD",
          "sourceUrl": "https://www.target.com/p/-/A-13977966",
          "checkedOn": "2026-10-20",
          "illustrative": true
        },
        "sourceLabel": "CeraVe: product & ingredients"
      },
      "proposedProduct": {
        "id": "neutrogena-hydro-boost-water-cream-6806486",
        "name": "Neutrogena Hydro Boost Hyaluronic Acid Water Cream Fragrance Free",
        "brand": "Neutrogena",
        "variant": "Hydro Boost Hyaluronic Acid Water Cream Fragrance Free",
        "sizeLabel": "1.7 fl oz / 50 mL",
        "productUrl": "https://www.neutrogena.com/products/skincare/neutrogena-hydro-boost-water-cream-fragrance-free/6806486",
        "imageUrl": "https://portal.goshelv.com/maya/assets/hydro.jpg",
        "reference": "Fragrance-free Water Cream. Choose this formulation rather than the fragranced Water Gel.",
        "displayPrice": {
          "cents": 1999,
          "currency": "USD",
          "sourceUrl": "https://www.target.com/p/-/A-88452179",
          "checkedOn": "2026-10-20",
          "illustrative": true
        },
        "sourceLabel": "Neutrogena: product & ingredients"
      },
      "usage": {
        "periods": [
          "morning",
          "evening"
        ],
        "order": 4,
        "short": {
          "morning": "Hydro Boost in place of CeraVe; follow with sunscreen.",
          "evening": "After cleansing, apply Hydro Boost in place of CeraVe."
        },
        "instructions": [
          "Apply evenly to face and neck after cleansing, following the product label. Use it in place of your current moisturizer.",
          "In the morning, follow with sunscreen. Make this later change separately, after the treatment is settled. You don’t need to buy it now."
        ]
      },
      "comparisons": [
        {
          "label": "Niacinamide",
          "currentText": "Contains it",
          "proposedText": "Not in listed formula",
          "significance": "Your CeraVe contains niacinamide and has felt comfortable for months, so leaving it out isn’t a goal here. I’d test fewer serum layers first for the pilling you’ve noticed.",
          "ingredientGuideKey": "niacinamide",
          "guideNote": null,
          "sources": []
        },
        {
          "label": "Ceramides",
          "currentText": "3 types\nNP · AP · EOP",
          "proposedText": "1 type\nNP",
          "significance": "Your CeraVe already keeps your skin comfortable. Fewer ceramide types in Hydro Boost aren’t a reason to leave a moisturizer that works for you; comfort matters more than the count.",
          "ingredientGuideKey": "ceramides",
          "guideNote": null,
          "sources": []
        },
        {
          "label": "Urea",
          "currentText": "Not in listed formula",
          "proposedText": "Contains it",
          "significance": "Urea adds to the moisture-binding blend in this option. If you choose to try it later, I’d look for comfortable cheeks through the day and good sunscreen and makeup wear.",
          "ingredientGuideKey": null,
          "guideNote": null,
          "sources": []
        }
      ],
      "factsTitle": "Product reference",
      "facts": [],
      "how": {
        "id": "maya-guide-moisturizer",
        "productId": "neutrogena-hydro-boost-water-cream-6806486",
        "title": "How to use Hydro Boost",
        "intro": "",
        "steps": [
          {
            "title": null,
            "body": "Apply evenly to face and neck after cleansing, following the product label. Use it in place of your current moisturizer."
          },
          {
            "title": null,
            "body": "In the morning, follow with sunscreen. Make this later change separately, after the treatment is settled. You don’t need to buy it now."
          }
        ],
        "careNote": null,
        "sources": []
      },
      "sources": [],
      "decisionLabels": {
        "current": "KEEP",
        "proposed": "OPTIONAL ALTERNATIVE"
      }
    },
    {
      "id": "maya-card-cleanser",
      "slot": "cleanser",
      "kind": "finish_then_replace",
      "recommendationId": null,
      "title": "Cleanser",
      "subtitle": "",
      "rationaleTitle": "Why I chose this for you",
      "reasons": [
        {
          "title": "Why I chose this for you",
          "body": "Your CeraVe cleanser is comfortable, so I’d finish the bottle first. For your next bottle, I’d try Aveeno Daily Moisturizing Facial Cleanser: $11.60 at Walmart for 12 fl oz, compared with $13.79 at Target for the same size. Both are fragrance-free. Aveeno uses a foaming oat-based formula instead of CeraVe’s creamier wash, but the saving only matters if it leaves your skin just as comfortable."
        }
      ],
      "actions": [
        "Finish your current cleanser, and make this switch separately from starting the treatment.",
        "If Aveeno leaves your skin tight or irritated, the lower price isn’t a reason to keep using it."
      ],
      "currentProduct": {
        "id": "cerave-hydrating-cleanser",
        "name": "CeraVe Hydrating Facial Cleanser",
        "brand": "CeraVe",
        "variant": "Hydrating Facial Cleanser",
        "sizeLabel": "12 fl oz / 355 mL",
        "productUrl": "https://www.cerave.com/skincare/cleansers/hydrating-facial-cleanser",
        "imageUrl": "https://portal.goshelv.com/maya/assets/cleanser.jpg",
        "reference": "A non-foaming facial cleanser with ceramides and hyaluronic acid.",
        "displayPrice": {
          "cents": 1379,
          "currency": "USD",
          "sourceUrl": "https://www.target.com/p/-/A-13977968",
          "checkedOn": "2026-10-20",
          "illustrative": true
        },
        "sourceLabel": "CeraVe: product & ingredients"
      },
      "proposedProduct": {
        "id": "aveeno-soothing-oat-cleanser",
        "name": "Aveeno Daily Moisturizing Facial Cleanser, Soothing Oat",
        "brand": "Aveeno",
        "variant": "Daily Moisturizing Facial Cleanser, Soothing Oat",
        "sizeLabel": "12 fl oz / 354 mL",
        "productUrl": "https://www.aveeno.com/products/daily-moisturizing-facial-cleanser-soothing-oat",
        "imageUrl": "https://portal.goshelv.com/maya/assets/aveeno.jpg",
        "reference": "Fragrance-free facial cleanser with soothing oat. Finish CeraVe first; this is a later cleanser option.",
        "displayPrice": {
          "cents": 1160,
          "currency": "USD",
          "sourceUrl": "https://www.walmart.com/ip/843259195",
          "checkedOn": "2026-10-20",
          "illustrative": true
        },
        "sourceLabel": "Aveeno: product & ingredients"
      },
      "usage": {
        "periods": [
          "evening"
        ],
        "order": 2,
        "short": {
          "morning": null,
          "evening": "Use CeraVe in the evening until this bottle is finished."
        },
        "instructions": [
          "Use your comfortable CeraVe cleanser in the evening. Finish this bottle before trying Aveeno."
        ]
      },
      "comparisons": [
        {
          "label": "Ceramides",
          "currentText": "3 types\nNP · AP · EOP",
          "proposedText": "Not in listed formula",
          "significance": "Your current cleanser is comfortable, so Aveeno having no ceramides listed isn’t a reason to rush a switch. I’d finish CeraVe and save Aveeno’s different blend for the next bottle.",
          "ingredientGuideKey": "ceramides",
          "guideNote": null,
          "sources": []
        },
        {
          "label": "Coco-Glucoside",
          "currentText": "Not in listed formula",
          "proposedText": "Contains it",
          "significance": "I’d keep this foaming cleanser change separate from starting azelaic acid. That gives you a clearer chance to notice how your skin feels with the new wash while the rest of your routine stays familiar.",
          "ingredientGuideKey": null,
          "guideNote": null,
          "sources": []
        },
        {
          "label": "Sodium Cocoyl Glutamate",
          "currentText": "Not in listed formula",
          "proposedText": "Contains it",
          "significance": "When you reach the next bottle, I’d check how this different cleansing blend rinses away the day’s remaining products. Easy rinsing without tightness or residue matters more than the lower price.",
          "ingredientGuideKey": null,
          "guideNote": null,
          "sources": []
        }
      ],
      "factsTitle": "Product reference",
      "facts": [],
      "how": {
        "id": "maya-guide-cleanser",
        "productId": "aveeno-soothing-oat-cleanser",
        "title": "How to make the later change",
        "intro": "",
        "steps": [
          {
            "title": null,
            "body": "Finish CeraVe first, and keep the cleanser change separate from introducing azelaic acid."
          },
          {
            "title": null,
            "body": "Once you try Aveeno, follow its label, rinse thoroughly and judge it by comfort and removal of the day’s remaining products."
          }
        ],
        "careNote": null,
        "sources": []
      },
      "sources": [],
      "decisionLabels": {
        "current": "FINISH THIS BOTTLE",
        "proposed": "NEXT BOTTLE"
      }
    },
    {
      "id": "maya-card-makeup-removal",
      "slot": "makeup-removal",
      "kind": "optional_alternative",
      "recommendationId": "maya-balm-1",
      "title": "Makeup removal",
      "subtitle": "",
      "rationaleTitle": "Why I’m keeping Bioderma for you",
      "reasons": [
        {
          "title": "Why I’m keeping Bioderma for you",
          "body": "Bioderma is already taking your makeup off comfortably. I’d keep it and use a well-soaked soft pad with a light touch before your cleanser."
        },
        {
          "title": "Optional alternative",
          "body": "If you’d rather use your fingertips and rinse than use cotton pads, this is an optional alternative. There’s no extra product to add to your evening routine."
        }
      ],
      "actions": [
        "Use it instead of Bioderma, then follow with your regular cleanser. You don’t need both makeup removers.",
        "Look for easy removal without troublesome residue or irritation."
      ],
      "currentProduct": {
        "id": "bioderma-sensibio-h2o",
        "name": "Bioderma Sensibio H2O",
        "brand": "Bioderma",
        "variant": "Sensibio H2O",
        "sizeLabel": "16.9 fl oz / 500 mL",
        "productUrl": "https://www.bioderma.us/en/p/sensibio-h2o-micellar-water.html",
        "imageUrl": "https://portal.goshelv.com/maya/assets/remover.jpg",
        "reference": "The brand describes Sensibio H2O as a micellar cleansing and makeup-removing water.",
        "displayPrice": {
          "cents": 2099,
          "currency": "USD",
          "sourceUrl": "https://www.target.com/p/-/A-82287056",
          "checkedOn": "2026-10-20",
          "illustrative": true
        },
        "sourceLabel": "Bioderma: product & ingredients"
      },
      "proposedProduct": {
        "id": "cerave-makeup-removing-balm",
        "name": "CeraVe Makeup Removing Cleanser Balm",
        "brand": "CeraVe",
        "variant": "Makeup Removing Cleanser Balm",
        "sizeLabel": "1.3 oz",
        "productUrl": "https://www.cerave.com/skincare/cleansers/makeup-removing-cleanser-balm/",
        "imageUrl": "https://portal.goshelv.com/maya/assets/balm.jpg",
        "reference": "A rinse-off makeup-removing balm. Use in place of micellar water, then follow with your cleanser; avoid direct contact with eyes.",
        "displayPrice": {
          "cents": 1169,
          "currency": "USD",
          "sourceUrl": "https://www.target.com/p/-/A-85920760",
          "checkedOn": "2026-10-20",
          "illustrative": true
        },
        "sourceLabel": "CeraVe: product & ingredients"
      },
      "usage": {
        "periods": [
          "evening"
        ],
        "order": 1,
        "short": {
          "morning": null,
          "evening": "On makeup days, before your cleanser."
        },
        "instructions": [
          "On makeup days, use the balm in place of Bioderma, not alongside it.",
          "Follow the product label and avoid direct contact with eyes. Rinse off, then follow with your cleanser."
        ]
      },
      "comparisons": [
        {
          "label": "PEG-6 Caprylic/Capric Glycerides",
          "currentText": "Contains it",
          "proposedText": "Not in listed formula",
          "significance": "This is part of the micellar formula that already takes your makeup off comfortably with a pad. I’d keep that familiar method unless you’d prefer to remove it with your fingertips and rinse.",
          "ingredientGuideKey": null,
          "guideNote": null,
          "sources": []
        },
        {
          "label": "Ethylhexyl Palmitate",
          "currentText": "Not in listed formula",
          "proposedText": "Contains it",
          "significance": "The balm’s oily blend gives you the fingertip-and-rinse option. If you choose it, I’d check for easy removal and a clean rinse without troublesome residue, rather than assume it will remove your makeup better.",
          "ingredientGuideKey": null,
          "guideNote": null,
          "sources": []
        },
        {
          "label": "Ceramides",
          "currentText": "Not in listed formula",
          "proposedText": "3 types\nNP · AP · EOP",
          "significance": "I wouldn’t buy the balm for ceramides when Bioderma already works comfortably for you. If you prefer the balm, it replaces Bioderma; your regular cleanser still follows.",
          "ingredientGuideKey": "ceramides",
          "guideNote": null,
          "sources": []
        }
      ],
      "factsTitle": "Product reference",
      "facts": [],
      "how": {
        "id": "maya-guide-remover",
        "productId": "cerave-makeup-removing-balm",
        "title": "How to use the balm",
        "intro": "",
        "steps": [
          {
            "title": null,
            "body": "On makeup days, use the balm in place of Bioderma, not alongside it."
          },
          {
            "title": null,
            "body": "Follow the product label and avoid direct contact with eyes. Rinse off, then follow with your cleanser."
          }
        ],
        "careNote": null,
        "sources": []
      },
      "sources": [],
      "group": "cleanser",
      "decisionLabels": {
        "current": "KEEP",
        "proposed": "OPTIONAL ALTERNATIVE"
      }
    },
    {
      "id": "maya-card-sunscreen",
      "slot": "sunscreen",
      "kind": "keep",
      "recommendationId": null,
      "title": "Sunscreen",
      "subtitle": "",
      "rationaleTitle": "Why I’m keeping this for you",
      "reasons": [
        {
          "title": "Why I’m keeping this for you",
          "body": "Your sunscreen works well with your basic routine. I’d keep it and focus on the serum layering that sometimes makes you use less of it. With the brown marks as our priority, I want sun protection to be the step you can apply properly, rather than the one you cut back to make makeup sit better."
        }
      ],
      "actions": [
        "Try the simpler morning routine without the two serums and notice how your usual makeup wears.",
        "Apply generously as directed before going outdoors and reapply at least every 2 hours outdoors. For swimming or sweating, choose a water-resistant sunscreen; this bottle isn’t labeled for that use."
      ],
      "currentProduct": {
        "id": "lrp-anthelios-uv-control-spf50",
        "name": "La Roche-Posay Anthelios UV Control Sunscreen SPF 50",
        "brand": "La Roche-Posay",
        "variant": "Anthelios UV Control Sunscreen SPF 50",
        "sizeLabel": "1.7 fl oz / 50 mL",
        "productUrl": "https://www.laroche-posay.us/our-products/sun/face-sunscreen/anthelios-uv-control-sunscreen-spf-50-3606000622111.html",
        "imageUrl": "https://portal.goshelv.com/maya/assets/sunscreen.webp",
        "reference": "US formula reference: daily facial sunscreen, SPF 50. This bottle isn’t labeled water-resistant.",
        "displayPrice": {
          "cents": 3999,
          "currency": "USD",
          "sourceUrl": "https://www.laroche-posay.us/our-products/sun/face-sunscreen/anthelios-uv-control-sunscreen-spf-50-3606000622111.html",
          "checkedOn": "2026-10-20",
          "illustrative": true
        },
        "sourceLabel": "La Roche-Posay: product & ingredients"
      },
      "proposedProduct": null,
      "usage": {
        "periods": [
          "morning"
        ],
        "order": 5,
        "short": {
          "morning": "Apply generously as directed before going outdoors. Reapply at least every 2 hours outdoors; use a water-resistant sunscreen for swimming or sweating.",
          "evening": null
        },
        "instructions": [
          "Apply generously as directed, 15 minutes before sun exposure. Reapply at least every 2 hours outdoors. For swimming or sweating, choose a water-resistant sunscreen."
        ]
      },
      "comparisons": [],
      "factsTitle": "Product reference",
      "facts": [],
      "how": {
        "id": "maya-guide-sunscreen",
        "productId": "lrp-anthelios-uv-control-spf50",
        "title": "How to use it",
        "intro": "",
        "steps": [
          {
            "title": null,
            "body": "Apply generously as directed, 15 minutes before sun exposure. Reapply at least every 2 hours outdoors. For swimming or sweating, choose a water-resistant sunscreen."
          }
        ],
        "careNote": null,
        "sources": []
      },
      "sources": []
    },
    {
      "id": "maya-card-treatments",
      "slot": "treatments",
      "kind": "addition",
      "recommendationId": "maya-azelaic-1",
      "title": "Treatments",
      "subtitle": "",
      "rationaleTitle": "Why I chose this for you",
      "reasons": [
        {
          "title": "Why I chose this for you",
          "body": "The marks that linger after spots are your priority, so azelaic acid is the one new treatment I’d try. We’ll keep your comfortable basics and leave the glycolic toner out while you introduce it. The stronger clinical evidence is for 15–20% formulas, so I can’t assume this 10% bottle will give the same results. We’ll watch how your skin feels and whether the marks gradually change before deciding what comes next."
        }
      ],
      "actions": [
        "Introduce it gradually using the routine guide. Keep the glycolic toner and other new actives out during this trial.",
        "At our check-in, we’ll review application, irritation and the marks together. If progress stalls, we’ll reassess the plan rather than automatically increase the strength."
      ],
      "currentProduct": null,
      "proposedProduct": {
        "id": "ordinary-azelaic-10",
        "name": "The Ordinary Azelaic Acid Suspension 10%",
        "brand": "The Ordinary",
        "variant": "Azelaic Acid Suspension 10%",
        "sizeLabel": "30 mL",
        "productUrl": "https://theordinary.com/en-us/azelaic-acid-suspension-10-exfoliator-100407.html",
        "imageUrl": "https://portal.goshelv.com/maya/assets/azelaic.png",
        "reference": "Azelaic Acid Suspension 10% · 30 mL. Follow the manufacturer’s directions.",
        "displayPrice": {
          "cents": 1220,
          "currency": "USD",
          "sourceUrl": "https://theordinary.com/en-us/azelaic-acid-suspension-10-exfoliator-100407.html",
          "checkedOn": "2026-10-20",
          "illustrative": true
        },
        "sourceLabel": "The Ordinary: product & ingredients"
      },
      "usage": {
        "periods": [
          "evening"
        ],
        "order": 3,
        "short": {
          "morning": null,
          "evening": "On azelaic nights: apply to dry skin after cleansing, then use your moisturizer. Follow the gradual introduction in your guide."
        },
        "instructions": [
          "Patch test first, following the manufacturer’s directions. Don’t use the product if the patch test causes redness, burning, itching, blistering or irritation.",
          "After cleansing, let your skin dry. Apply a small amount in a thin layer to intact skin, avoiding eyes, lips and broken skin. Follow with your moisturizer.",
          "Start with two nonconsecutive evenings in the first week. If your skin stays comfortable, try alternate evenings the next week. Build toward nightly use only while it stays comfortable; there’s no need to rush. We’re starting slowly to check comfort; this schedule isn’t proven to work best.",
          "Keep glycolic toner out and don’t introduce a retinoid or another exfoliant at the same time.",
          "If irritation develops, rinse off and stop. Seek advice if it persists. Get urgent help for swelling or breathing trouble."
        ]
      },
      "comparisons": [],
      "factsTitle": "Evidence & limits",
      "facts": [],
      "how": {
        "id": "maya-guide-azelaic",
        "productId": "ordinary-azelaic-10",
        "title": "How to introduce it",
        "intro": "",
        "steps": [
          {
            "title": null,
            "body": "Patch test first, following the manufacturer’s directions. Don’t use the product if the patch test causes redness, burning, itching, blistering or irritation."
          },
          {
            "title": null,
            "body": "After cleansing, let your skin dry. Apply a small amount in a thin layer to intact skin, avoiding eyes, lips and broken skin. Follow with your moisturizer."
          },
          {
            "title": null,
            "body": "Start with two nonconsecutive evenings in the first week. If your skin stays comfortable, try alternate evenings the next week. Build toward nightly use only while it stays comfortable; there’s no need to rush. We’re starting slowly to check comfort; this schedule isn’t proven to work best."
          },
          {
            "title": null,
            "body": "Keep glycolic toner out and don’t introduce a retinoid or another exfoliant at the same time."
          },
          {
            "title": null,
            "body": "If irritation develops, rinse off and stop. Seek advice if it persists. Get urgent help for swelling or breathing trouble."
          }
        ],
        "careNote": null,
        "sources": [
          {
            "label": "The Ordinary directions",
            "url": "https://theordinary.com/en-us/azelaic-acid-suspension-10-exfoliator-100407.html"
          }
        ]
      },
      "sources": [
        {
          "label": "15% azelaic acid study",
          "url": "https://link.springer.com/article/10.1007/s13555-024-01176-2"
        },
        {
          "label": "20% azelaic acid study",
          "url": "https://pmc.ncbi.nlm.nih.gov/articles/PMC10199364/"
        }
      ]
    },
    {
      "id": "maya-card-serums",
      "slot": "serums",
      "kind": "pause",
      "recommendationId": null,
      "title": "Your two serums",
      "subtitle": "",
      "rationaleTitle": "Why I’d pause these for now",
      "reasons": [
        {
          "title": "Why I’d pause these for now",
          "body": "You’ve been layering these on some mornings without a clear sense of what each adds. I’d pause both while we simplify the routine. Hyaluronic acid and niacinamide can be used together; this is about seeing whether those extra product layers are making sunscreen and makeup harder to wear."
        }
      ],
      "actions": [
        "Your moisturizer already provides hydration, so pausing a separate hydrating serum doesn’t mean leaving that need unmet.",
        "If the simpler routine wears better, we can decide whether either serum earns a place back, one at a time."
      ],
      "currentProduct": {
        "id": "ordinary-ha-b5",
        "name": "The Ordinary Hyaluronic Acid 2% + B5 (with Ceramides)",
        "brand": "The Ordinary",
        "variant": "Hyaluronic Acid 2% + B5 (with Ceramides)",
        "sizeLabel": "30 mL",
        "productUrl": "https://theordinary.com/en-us/hyaluronic-acid-2-b5-serum-with-ceramides-100637.html",
        "imageUrl": "https://portal.goshelv.com/maya/assets/ha.png",
        "reference": "A hydration-focused serum. Hyaluronic acid is a different ingredient category from the glycolic exfoliant.",
        "displayPrice": {
          "cents": 990,
          "currency": "USD",
          "sourceUrl": "https://theordinary.com/en-us/hyaluronic-acid-2-b5-serum-with-ceramides-100637.html",
          "checkedOn": "2026-10-20",
          "illustrative": true
        },
        "sourceLabel": "The Ordinary: product & ingredients"
      },
      "proposedProduct": {
        "id": "ordinary-niacinamide-zinc",
        "name": "The Ordinary Niacinamide 10% + Zinc 1%",
        "brand": "The Ordinary",
        "variant": "Niacinamide 10% + Zinc 1%",
        "sizeLabel": "30 mL",
        "productUrl": "https://theordinary.com/en-us/niacinamide-10-zinc-1-serum-100436.html",
        "imageUrl": "https://portal.goshelv.com/maya/assets/niacinamide.png",
        "reference": "The brand lists niacinamide and zinc PCA in this water-based serum.",
        "displayPrice": {
          "cents": 600,
          "currency": "USD",
          "sourceUrl": "https://theordinary.com/en-us/niacinamide-10-zinc-1-serum-100436.html",
          "checkedOn": "2026-10-20",
          "illustrative": true
        },
        "sourceLabel": "The Ordinary: product & ingredients"
      },
      "usage": null,
      "comparisons": [],
      "factsTitle": "Product reference",
      "facts": [],
      "how": {
        "id": "maya-guide-serums",
        "productId": "ordinary-ha-b5",
        "title": "What to do for now",
        "intro": "",
        "steps": [
          {
            "title": null,
            "body": "Pause the separate hyaluronic acid and niacinamide serums while simplifying the morning layers."
          },
          {
            "title": null,
            "body": "If the simpler routine wears better, decide whether either serum earns a place back, one at a time."
          }
        ],
        "careNote": null,
        "sources": []
      },
      "sources": [],
      "group": "treatments",
      "decisionLabels": {
        "current": "PAUSE",
        "proposed": "PAUSE"
      }
    },
    {
      "id": "maya-card-exfoliant",
      "slot": "exfoliant",
      "kind": "leave_out",
      "recommendationId": null,
      "title": "Glycolic toner",
      "subtitle": "",
      "rationaleTitle": "Why I’d leave this out",
      "reasons": [
        {
          "title": "Why I’d leave this out",
          "body": "You stopped this after your cheeks felt hot and tight, and your basics have felt comfortable again since. I’d leave it out while we introduce azelaic acid. That experience doesn’t mean every ingredient called an acid will behave the same way, but it does tell me we should avoid several new treatments at once."
        }
      ],
      "actions": [
        "Keep the glycolic toner out. If you develop burning, peeling or other irritation while trying azelaic acid, stop the azelaic acid and seek advice if it persists."
      ],
      "currentProduct": {
        "id": "ordinary-glycolic-7",
        "name": "The Ordinary Glycolic Acid 7% Exfoliating Toner",
        "brand": "The Ordinary",
        "variant": "Glycolic Acid 7% Exfoliating Toner",
        "sizeLabel": "100 mL",
        "productUrl": "https://theordinary.com/en-us/glycolic-acid-7-exfoliating-toner-100418.html",
        "imageUrl": "https://portal.goshelv.com/maya/assets/glycolic.png",
        "reference": "A toner with 7% glycolic acid, an alpha hydroxy acid used for exfoliation.",
        "displayPrice": {
          "cents": 900,
          "currency": "USD",
          "sourceUrl": "https://theordinary.com/en-us/glycolic-acid-7-exfoliating-toner-100418.html",
          "checkedOn": "2026-10-20",
          "illustrative": true
        },
        "sourceLabel": "The Ordinary: product & ingredients"
      },
      "proposedProduct": null,
      "usage": null,
      "comparisons": [],
      "factsTitle": "Product reference",
      "facts": [],
      "how": {
        "id": "maya-guide-glycolic",
        "productId": "ordinary-glycolic-7",
        "title": "What to do for now",
        "intro": "",
        "steps": [
          {
            "title": null,
            "body": "Keep the glycolic toner out while introducing azelaic acid. Don’t introduce a retinoid or another exfoliant at the same time."
          }
        ],
        "careNote": null,
        "sources": []
      },
      "sources": [],
      "group": "treatments"
    }
  ],
  "baselineRoutine": [
    {
      "id": "maya-water-rinse",
      "kind": "instruction",
      "slot": null,
      "productId": null,
      "product": null,
      "title": "Your usual water rinse",
      "usage": {
        "periods": [
          "morning"
        ],
        "order": 1,
        "short": {
          "morning": "Keep your morning water rinse.",
          "evening": null
        },
        "instructions": [
          "Keep your morning water rinse. More cleansing isn’t the goal."
        ]
      }
    },
    {
      "id": "maya-baseline-moisturizer",
      "kind": "product",
      "slot": "moisturizer",
      "productId": "cerave-pm",
      "product": {
        "id": "cerave-pm",
        "name": "CeraVe PM Facial Moisturizing Lotion",
        "brand": "CeraVe PM",
        "variant": "Facial Moisturizing Lotion",
        "sizeLabel": "3 fl oz",
        "productUrl": "https://www.cerave.com/skincare/moisturizers/pm-facial-moisturizing-lotion",
        "imageUrl": "https://portal.goshelv.com/maya/assets/moisturizer.jpg",
        "reference": "The brand lists ceramides, niacinamide and hyaluronic acid in this facial lotion.",
        "displayPrice": {
          "cents": 1499,
          "currency": "USD",
          "sourceUrl": "https://www.target.com/p/-/A-13977966",
          "checkedOn": "2026-10-20",
          "illustrative": true
        },
        "sourceLabel": "CeraVe: product & ingredients"
      },
      "title": "CeraVe PM Facial Moisturizing Lotion",
      "usage": {
        "periods": [
          "morning",
          "evening"
        ],
        "order": 4,
        "short": {
          "morning": "Keep your comfortable moisturizer beneath sunscreen.",
          "evening": "Follow cleansing with your comfortable moisturizer."
        },
        "instructions": [
          "Keep the moisturizer that feels comfortable, morning and evening."
        ]
      }
    },
    {
      "id": "maya-baseline-cleanser",
      "kind": "product",
      "slot": "cleanser",
      "productId": "cerave-hydrating-cleanser",
      "product": {
        "id": "cerave-hydrating-cleanser",
        "name": "CeraVe Hydrating Facial Cleanser",
        "brand": "CeraVe",
        "variant": "Hydrating Facial Cleanser",
        "sizeLabel": "12 fl oz / 355 mL",
        "productUrl": "https://www.cerave.com/skincare/cleansers/hydrating-facial-cleanser",
        "imageUrl": "https://portal.goshelv.com/maya/assets/cleanser.jpg",
        "reference": "A non-foaming facial cleanser with ceramides and hyaluronic acid.",
        "displayPrice": {
          "cents": 1379,
          "currency": "USD",
          "sourceUrl": "https://www.target.com/p/-/A-13977968",
          "checkedOn": "2026-10-20",
          "illustrative": true
        },
        "sourceLabel": "CeraVe: product & ingredients"
      },
      "title": "CeraVe Hydrating Facial Cleanser",
      "usage": {
        "periods": [
          "evening"
        ],
        "order": 2,
        "short": {
          "morning": null,
          "evening": "Use CeraVe in the evening until this bottle is finished."
        },
        "instructions": [
          "Use your comfortable CeraVe cleanser in the evening. Finish this bottle before trying Aveeno."
        ]
      }
    },
    {
      "id": "maya-baseline-remover",
      "kind": "product",
      "slot": "makeup-removal",
      "productId": "bioderma-sensibio-h2o",
      "product": {
        "id": "bioderma-sensibio-h2o",
        "name": "Bioderma Sensibio H2O",
        "brand": "Bioderma",
        "variant": "Sensibio H2O",
        "sizeLabel": "16.9 fl oz / 500 mL",
        "productUrl": "https://www.bioderma.us/en/p/sensibio-h2o-micellar-water.html",
        "imageUrl": "https://portal.goshelv.com/maya/assets/remover.jpg",
        "reference": "The brand describes Sensibio H2O as a micellar cleansing and makeup-removing water.",
        "displayPrice": {
          "cents": 2099,
          "currency": "USD",
          "sourceUrl": "https://www.target.com/p/-/A-82287056",
          "checkedOn": "2026-10-20",
          "illustrative": true
        },
        "sourceLabel": "Bioderma: product & ingredients"
      },
      "title": "Bioderma Sensibio H2O",
      "usage": {
        "periods": [
          "evening"
        ],
        "order": 1,
        "short": {
          "morning": null,
          "evening": "If wearing makeup: use Bioderma before your cleanser. Use one makeup remover."
        },
        "instructions": [
          "On makeup days, use one makeup remover before your cleanser. Use Bioderma with a well-soaked soft pad and a light touch. The balm is an optional alternative, not another step."
        ]
      }
    },
    {
      "id": "maya-baseline-sunscreen",
      "kind": "product",
      "slot": "sunscreen",
      "productId": "lrp-anthelios-uv-control-spf50",
      "product": {
        "id": "lrp-anthelios-uv-control-spf50",
        "name": "La Roche-Posay Anthelios UV Control Sunscreen SPF 50",
        "brand": "La Roche-Posay",
        "variant": "Anthelios UV Control Sunscreen SPF 50",
        "sizeLabel": "1.7 fl oz / 50 mL",
        "productUrl": "https://www.laroche-posay.us/our-products/sun/face-sunscreen/anthelios-uv-control-sunscreen-spf-50-3606000622111.html",
        "imageUrl": "https://portal.goshelv.com/maya/assets/sunscreen.webp",
        "reference": "US formula reference: daily facial sunscreen, SPF 50. This bottle isn’t labeled water-resistant.",
        "displayPrice": {
          "cents": 3999,
          "currency": "USD",
          "sourceUrl": "https://www.laroche-posay.us/our-products/sun/face-sunscreen/anthelios-uv-control-sunscreen-spf-50-3606000622111.html",
          "checkedOn": "2026-10-20",
          "illustrative": true
        },
        "sourceLabel": "La Roche-Posay: product & ingredients"
      },
      "title": "La Roche-Posay Anthelios UV Control Sunscreen SPF 50",
      "usage": {
        "periods": [
          "morning"
        ],
        "order": 5,
        "short": {
          "morning": "Apply generously as directed before going outdoors. Reapply at least every 2 hours outdoors; use a water-resistant sunscreen for swimming or sweating.",
          "evening": null
        },
        "instructions": [
          "Apply generously as directed, 15 minutes before sun exposure. Reapply at least every 2 hours outdoors. For swimming or sweating, choose a water-resistant sunscreen."
        ]
      }
    },
    {
      "id": "maya-baseline-makeup",
      "kind": "product",
      "slot": "makeup",
      "productId": "maybelline-fit-me",
      "product": {
        "id": "maybelline-fit-me",
        "name": "Maybelline Fit Me Matte + Poreless",
        "brand": "Maybelline",
        "variant": "Fit Me Matte + Poreless",
        "sizeLabel": "",
        "productUrl": "https://www.maybelline.com/face-makeup/foundation-makeup/fit-me-matte-poreless-foundation",
        "imageUrl": "https://portal.goshelv.com/maya/assets/makeup.jpg",
        "reference": "A liquid foundation with a matte finish. Your usual makeup appears after sunscreen in the morning routine. The reference image is not a match to your shade; that shade has not been recorded.",
        "displayPrice": null,
        "sourceLabel": "Maybelline: product & ingredients"
      },
      "title": "Maybelline Fit Me Matte + Poreless",
      "usage": {
        "periods": [
          "morning"
        ],
        "order": 6,
        "short": {
          "morning": "Your usual makeup, if you want to wear it. Brand reference image; your shade is not recorded.",
          "evening": null
        },
        "instructions": [
          "Makeup is optional."
        ]
      }
    }
  ],
  "routineGuides": []
};
export function createMayaSample() {
  const presentation=structuredClone(approvedPresentation),recommendations=deriveRecommendations(presentation);
  const plan={version:1,presentation,recommendations,itemStates:recommendations.map(item=>({recommendationId:item.id,choice:null,reason:null,received:false,startedOn:null}))};
  const activeRoutine=presentation.baselineRoutine.map(step=>({...structuredClone(step),source:{kind:'baseline',publicationVersion:1,recommendationId:null},guides:presentation.routineGuides.filter(guide=>guide.productId===null||guide.productId===step.productId).map(guide=>structuredClone(guide))}));
  return {schemaVersion:1,mode:'published',sample:true,clientId:'sample:maya',revision:0,draft:null,
    clientView:{schemaVersion:2,revision:0,plan,history:[],routine:presentation.baselineRoutine.filter(step=>step.kind==='product').map(step=>({slot:step.slot,productId:step.productId})),routineHistory:[],activeRoutine,orderProposal:{kind:'proposal',currency:'USD',items:[],subtotalCents:0,payable:false,shippingAndTaxConfirmed:false}},
    payments:{revision:0,quotes:[],claims:[],shippingAddress:null,shippingAddresses:[],service:{status:'unpaid',period:null},nextServicePeriod:null},
    checkins:{revision:0,nextCheckinOn:null,reports:[]}};
}
