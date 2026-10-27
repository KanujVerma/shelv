// Public command schemas. Actor, timestamp and authority are server-owned.
export const serviceSchemas={
 "record_review": {
  "type": "object",
  "fields": {
   "channel": {
    "type": "enum",
    "values": [
     "text",
     "call",
     "video",
     "in_person"
    ]
   },
   "occurredOn": {
    "type": "date"
   },
   "summary": {
    "type": "text",
    "max": 4000,
    "empty": false
   },
   "reportedUse": {
    "type": "text",
    "max": 4000,
    "empty": false
   },
   "decision": {
    "type": "text",
    "max": 4000,
    "empty": false
   },
   "nextReviewOn": {
    "type": "date",
    "nullable": true
   },
   "privateNote": {
    "type": "text",
    "max": 4000,
    "empty": true
   }
  }
 },
 "save_instruction_draft": {
  "type": "object",
  "fields": {
   "slot": {
    "type": "identifier"
   },
   "productId": {
    "type": "identifier"
   },
   "planVersion": {
    "type": "integer",
    "min": 1,
    "max": 9007199254740991
   },
   "baseInstructionVersion": {
    "type": "integer",
    "min": 0,
    "max": 9007199254740991
   },
   "usage": {
    "type": "object",
    "fields": {
     "periods": {
      "type": "array",
      "item": {
       "type": "enum",
       "values": [
        "morning",
        "evening"
       ]
      },
      "min": 1,
      "max": 2,
      "unique": true
     },
     "order": {
      "type": "integer",
      "min": 1,
      "max": 50
     },
     "short": {
      "type": "object",
      "fields": {
       "morning": {
        "type": "text",
        "max": 2000,
        "empty": false,
        "nullable": true
       },
       "evening": {
        "type": "text",
        "max": 2000,
        "empty": false,
        "nullable": true
       }
      }
     },
     "instructions": {
      "type": "array",
      "item": {
       "type": "text",
       "max": 2000,
       "empty": false
      },
      "min": 1,
      "max": 12
     }
    }
   },
   "reason": {
    "type": "text",
    "max": 4000,
    "empty": false
   },
   "reviewId": {
    "type": "text",
    "max": 36,
    "empty": false,
    "nullable": true
   },
   "effectiveOn": {
    "type": "date"
   }
  }
 },
 "publish_instruction_revision": {
  "type": "object",
  "fields": {
   "draftId": {
    "type": "text",
    "max": 36,
    "empty": false
   }
  }
 },
 "record_purchase": {
  "type": "object",
  "fields": {
   "quoteId": {
    "type": "text",
    "max": 36,
    "empty": false,
    "nullable": true
   },
   "recommendationId": {
    "type": "identifier",
    "nullable": true
   },
   "retailer": {
    "type": "text",
    "max": 200,
    "empty": false
   },
   "seller": {
    "type": "text",
    "max": 200,
    "empty": false
   },
   "productId": {
    "type": "identifier"
   },
   "productName": {
    "type": "text",
    "max": 200,
    "empty": false
   },
   "quantity": {
    "type": "integer",
    "min": 1,
    "max": 100
   },
   "unitPriceCents": {
    "type": "integer",
    "min": 1,
    "max": 100000000
   },
   "taxCents": {
    "type": "integer",
    "min": 0,
    "max": 100000000
   },
   "shippingCents": {
    "type": "integer",
    "min": 0,
    "max": 100000000
   },
   "purchasedOn": {
    "type": "date"
   },
   "deliveredOn": {
    "type": "date",
    "nullable": true
   },
   "policy": {
    "type": "object",
    "fields": {
     "checkedOn": {
      "type": "date"
     },
     "url": {
      "type": "url"
     },
     "summary": {
      "type": "text",
      "max": 2000,
      "empty": false
     },
     "openedAllowed": {
      "type": "boolean",
      "nullable": true
     },
     "finalSale": {
      "type": "boolean"
     },
     "returnBy": {
      "type": "date",
      "nullable": true
     },
     "shipBy": {
      "type": "date",
      "nullable": true
     },
     "returnCostCents": {
      "type": "integer",
      "min": 0,
      "max": 100000000
     }
    }
   },
   "orderReference": {
    "type": "text",
    "max": 1000,
    "empty": false
   },
   "receiptReference": {
    "type": "text",
    "max": 1000,
    "empty": false
   },
   "termsDisclosed": {
    "type": "enum",
    "values": [
     true
    ]
   }
  }
 },
 "request_return": {
  "type": "object",
  "fields": {
   "purchaseId": {
    "type": "text",
    "max": 36,
    "empty": false
   },
   "quantity": {
    "type": "integer",
    "min": 1,
    "max": 100
   },
   "reason": {
    "type": "text",
    "max": 2000,
    "empty": false
   },
   "condition": {
    "type": "enum",
    "values": [
     "unopened",
     "opened",
     "used",
     "damaged"
    ]
   }
  }
 },
 "record_return_event": {
  "type": "object",
  "fields": {
   "returnId": {
    "type": "text",
    "max": 36,
    "empty": false
   },
   "status": {
    "type": "enum",
    "values": [
     "requested",
     "reviewing",
     "authorized",
     "declined",
     "awaiting_return",
     "in_transit",
     "retailer_reviewing",
     "retailer_funds_received",
     "client_repaid"
    ]
   },
   "note": {
    "type": "text",
    "max": 4000,
    "empty": false
   },
   "expectedRefundCents": {
    "type": "integer",
    "min": 0,
    "max": 100000000,
    "nullable": true
   },
   "retailerRefundCents": {
    "type": "integer",
    "min": 0,
    "max": 100000000,
    "nullable": true
   },
   "clientRepaidCents": {
    "type": "integer",
    "min": 0,
    "max": 100000000,
    "nullable": true
   },
   "privateReference": {
    "type": "text",
    "max": 1000,
    "empty": true
   },
   "policyCheckedOn": {
    "type": "date",
    "nullable": true
   }
  }
 },
 "cancel_service": {
  "type": "object",
  "fields": {
   "kind": {
    "type": "enum",
    "values": [
     "period_end",
     "early_departure"
    ]
   },
   "supportEndsOn": {
    "type": "date"
   },
   "reason": {
    "type": "text",
    "max": 2000,
    "empty": false
   },
   "confirmedWithClient": {
    "type": "enum",
    "values": [
     true
    ]
   }
  }
 }
};
