import { Injectable } from "@angular/core";
import { Document } from "./document-number.interface";
import { gblDocumentMappings } from "./document-gbl-mapping";
import { nonGblDocumentMappings } from "./document-nongbl-mapping";

@Injectable({
  providedIn: "root",
})
export class DocumentMappingService {
  private gblDocumentMappings = gblDocumentMappings;
  private nonGblDocumentMappings = nonGblDocumentMappings;

  getDocuments(
    line: string,
    development_code: string,
    document_category: string
  ): Document[] {
    const key = `${development_code}_${document_category.toLowerCase()}`;
    if (line.startsWith("GBL")) {
      return this.gblDocumentMappings[key] || [];
    } else {
      console.log(this.nonGblDocumentMappings[key]);
      return this.nonGblDocumentMappings[key] || [];
    }
  }

  resetDocuments() {
    Object.keys(this.nonGblDocumentMappings).forEach((key) => {
      this.nonGblDocumentMappings[key].forEach((doc) => {
        doc.doc_number = null;
        doc.id_header = null;
        doc.file = null;
      });
    });

    Object.keys(this.gblDocumentMappings).forEach((key) => {
      this.gblDocumentMappings[key].forEach((doc) => {
        doc.doc_number = null;
        doc.id_header = null;
        doc.file = null;
      });
    });
  }
}
