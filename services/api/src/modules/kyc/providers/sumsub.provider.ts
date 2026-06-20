import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

// ---------------------------------------------------------------------------
// Types & interfaces
// ---------------------------------------------------------------------------

export interface SumsubApplicantInfo {
  firstName: string;
  lastName: string;
  dob: string; // YYYY-MM-DD
  country: string; // ISO 3166-1 alpha-3
}

export interface CreateApplicantParams {
  email: string;
  phone?: string;
  info: SumsubApplicantInfo;
  externalUserId?: string;
  metadata?: Record<string, string>;
}

export interface ApplicantResult {
  applicantId: string;
  status: SumsubReviewStatus;
  createdAt?: string;
  review?: {
    reviewStatus: string;
    reviewResult?: {
      reviewAnswer: 'GREEN' | 'RED';
      rejectLabels?: string[];
      reviewRejectType?: string;
    };
  };
  info?: SumsubApplicantInfo & Record<string, unknown>;
  metadata?: Record<string, string>;
}

export type SumsubReviewStatus =
  | 'init'
  | 'pending'
  | 'prechecked'
  | 'queued'
  | 'completed'
  | 'onHold'
  | 'cancelled';

export type SumsubWebhookType =
  | 'applicantCreated'
  | 'applicantPending'
  | 'applicantReviewed'
  | 'applicantOnHold'
  | 'applicantPersonalInfoChanged'
  | 'applicantDeleted'
  | 'applicantReset'
  | 'applicantLevelChanged'
  | 'applicantWorkflowCompleted';

export interface SumsubWebhookPayload {
  applicantId: string;
  inspectionId?: string;
  correlationId?: string;
  externalUserId?: string;
  type: SumsubWebhookType;
  reviewStatus: SumsubReviewStatus;
  createdAt: string;
  reviewResult?: {
    reviewAnswer: 'GREEN' | 'RED';
    rejectLabels?: string[];
    reviewRejectType?: string;
    moderationComment?: string;
    clientComment?: string;
  };
  applicantType?: string;
  applicantMemberOf?: unknown[];
  videoIdentReviewStatus?: string;
  applicantActionId?: string;
  externalApplicantActionId?: string;
  clientId?: string;
}

export interface UploadDocumentResult {
  id: string;
  metadata: {
    fileName: string;
    fileType: string;
    country: string;
    idDocType: string;
    idDocSubType?: string;
    side?: string;
  };
}

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

@Injectable()
export class SumsubProvider {
  readonly providerId = 'sumsub';
  private readonly logger = new Logger(SumsubProvider.name);

  private readonly apiToken: string;
  private readonly appToken: string;
  private readonly webhookSecret: string;
  private readonly baseUrl: string;

  constructor(private readonly configService: ConfigService) {
    this.apiToken = this.configService.get<string>('SUMSUB_API_TOKEN') || '';
    this.appToken = this.configService.get<string>('SUMSUB_APP_TOKEN') || '';
    this.webhookSecret =
      this.configService.get<string>('SUMSUB_WEBHOOK_SECRET') || '';
    this.baseUrl =
      this.configService.get<string>('SUMSUB_BASE_URL') ||
      'https://api.sumsub.com';
  }

  // -----------------------------------------------------------------------
  // Applicant management
  // -----------------------------------------------------------------------

  /**
   * Create a new applicant in Sumsub.
   * https://developers.sumsub.com/reference/create-applicant
   */
  async createApplicant(params: CreateApplicantParams): Promise<ApplicantResult> {
    if (!this.apiToken || !this.appToken) {
      this.logger.warn(
        'Sumsub credentials not configured — returning mock applicant',
      );
      return this.mockApplicant(params);
    }

    const body: Record<string, unknown> = {
      email: params.email,
      info: {
        firstName: params.info.firstName,
        lastName: params.info.lastName,
        dob: params.info.dob,
        country: params.info.country,
      },
    };

    if (params.phone) {
      body.phone = params.phone;
    }

    if (params.externalUserId) {
      body.externalUserId = params.externalUserId;
    }

    if (params.metadata) {
      body.metadata = Object.entries(params.metadata).map(([key, value]) => ({
        key,
        value,
      }));
    }

    try {
      const response = await this.request('/resources/applicants', body);

      return {
        applicantId: response.id,
        status: response.review?.reviewStatus || 'init',
        createdAt: response.createdAt,
        review: response.review,
        info: (response.info ?? params.info) as ApplicantResult['info'],
        metadata: this.flattenMetadata(response.metadata),
      };
    } catch (error) {
      this.logger.error('Sumsub createApplicant failed', (error as Error).stack);
      throw error;
    }
  }

  /**
   * Get the current verification / review status of an applicant.
   * https://developers.sumsub.com/reference/get-applicant-status
   */
  async getStatus(applicantId: string): Promise<ApplicantResult> {
    if (!this.apiToken || !this.appToken) {
      this.logger.warn(
        'Sumsub credentials not configured — returning mock status',
      );
      return {
        applicantId,
        status: 'completed',
        review: {
          reviewStatus: 'completed',
          reviewResult: { reviewAnswer: 'GREEN' },
        },
      };
    }

    try {
      const response = await this.request(
        `/resources/applicants/${applicantId}/status`,
        null,
        'POST',
      );

      return {
        applicantId,
        status: response.reviewStatus || response.review?.reviewStatus || 'pending',
        review: response.review || {
          reviewStatus: response.reviewStatus,
          reviewResult: response.reviewResult,
        },
      };
    } catch (error) {
      this.logger.error('Sumsub getStatus failed', (error as Error).stack);
      throw error;
    }
  }

  /**
   * Retrieve full applicant details.
   * https://developers.sumsub.com/reference/get-applicant-details
   */
  async getApplicant(applicantId: string): Promise<ApplicantResult> {
    if (!this.apiToken || !this.appToken) {
      this.logger.warn(
        'Sumsub credentials not configured — returning mock applicant',
      );
      return {
        applicantId,
        status: 'completed',
        review: {
          reviewStatus: 'completed',
          reviewResult: { reviewAnswer: 'GREEN' },
        },
      };
    }

    try {
      const response = await this.request(
        `/resources/applicants/${applicantId}/one`,
        null,
        'GET',
      );

      return {
        applicantId: response.id,
        status: response.review?.reviewStatus || 'init',
        createdAt: response.createdAt,
        review: response.review,
        info: response.info,
        metadata: this.flattenMetadata(response.metadata),
      };
    } catch (error) {
      this.logger.error('Sumsub getApplicant failed', (error as Error).stack);
      throw error;
    }
  }

  /**
   * Upload a document for an applicant.
   * https://developers.sumsub.com/reference/add-id-documents
   *
   * @param applicantId  Sumsub applicant ID
   * @param file         Raw file bytes (Buffer / Uint8Array)
   * @param metadata     Document metadata (country, idDocType, etc.)
   */
  async uploadDocument(
    applicantId: string,
    file: Buffer | Uint8Array,
    metadata: {
      country: string;
      idDocType: string;
      idDocSubType?: string;
      side?: string;
      fileName?: string;
    },
  ): Promise<UploadDocumentResult> {
    if (!this.apiToken || !this.appToken) {
      this.logger.warn(
        'Sumsub credentials not configured — returning mock document',
      );
      return {
        id: `mock-doc-${Date.now()}`,
        metadata: {
          fileName: metadata.fileName || 'document.jpg',
          fileType: 'jpg',
          country: metadata.country,
          idDocType: metadata.idDocType,
          idDocSubType: metadata.idDocSubType,
          side: metadata.side,
        },
      };
    }

    // Build multipart form data manually (no external deps)
    const boundary = `----SumsubFormBoundary${crypto.randomBytes(8).toString('hex')}`;
    const parts: Buffer[] = [];

    // Metadata field
    parts.push(
      Buffer.from(
        `--${boundary}\r\n` +
          `Content-Disposition: form-data; name="metadata"\r\n` +
          `Content-Type: application/json\r\n\r\n` +
          JSON.stringify({
            country: metadata.country,
            idDocType: metadata.idDocType,
            idDocSubType: metadata.idDocSubType,
            side: metadata.side,
          }) +
          `\r\n`,
      ),
    );

    // File field
    const fileName = metadata.fileName || 'document.jpg';
    parts.push(
      Buffer.from(
        `--${boundary}\r\n` +
          `Content-Disposition: form-data; name="content"; filename="${fileName}"\r\n` +
          `Content-Type: application/octet-stream\r\n\r\n`,
      ),
    );
    parts.push(Buffer.from(file));
    parts.push(Buffer.from(`\r\n--${boundary}--\r\n`));

    const body = Buffer.concat(parts);

    try {
      const response = await this.requestRaw(
        `/resources/applicants/${applicantId}/documents`,
        body,
        'POST',
        {
          'Content-Type': `multipart/form-data; boundary=${boundary}`,
        },
      );

      return {
        id: response.id,
        metadata: response.metadata || {
          fileName,
          fileType: fileName.split('.').pop() || 'unknown',
          country: metadata.country,
          idDocType: metadata.idDocType,
          idDocSubType: metadata.idDocSubType,
          side: metadata.side,
        },
      };
    } catch (error) {
      this.logger.error('Sumsub uploadDocument failed', (error as Error).stack);
      throw error;
    }
  }

  // -----------------------------------------------------------------------
  // Webhook helpers
  // -----------------------------------------------------------------------

  /**
   * Validate a Sumsub webhook signature.
   *
   * Sumsub signs webhooks using HMAC-SHA256 with the webhook secret.
   * The signature is sent in the `X-Payload-Signature` header.
   */
  validateWebhook(payload: string | Buffer, signature: string): boolean {
    if (!this.webhookSecret) {
      this.logger.warn(
        'SUMSUB_WEBHOOK_SECRET not set — skipping webhook validation',
      );
      return true;
    }

    try {
      const expected = crypto
        .createHmac('sha256', this.webhookSecret)
        .update(typeof payload === 'string' ? payload : Buffer.from(payload))
        .digest('hex');

      // Constant-time comparison to prevent timing attacks
      const a = Buffer.from(expected, 'hex');
      const b = Buffer.from(signature, 'hex');

      if (a.length !== b.length) {
        return false;
      }

      return crypto.timingSafeEqual(a, b);
    } catch (error) {
      this.logger.error('Webhook signature validation error', (error as Error).stack);
      return false;
    }
  }

  /**
   * Parse a raw webhook body into a typed payload.
   */
  parseWebhook(body: string | object): SumsubWebhookPayload {
    const data = typeof body === 'string' ? JSON.parse(body) : body;

    return {
      applicantId: data.applicantId,
      inspectionId: data.inspectionId,
      correlationId: data.correlationId,
      externalUserId: data.externalUserId,
      type: data.type,
      reviewStatus: data.reviewStatus,
      createdAt: data.createdAt,
      reviewResult: data.reviewResult,
      applicantType: data.applicantType,
      applicantMemberOf: data.applicantMemberOf,
      videoIdentReviewStatus: data.videoIdentReviewStatus,
      applicantActionId: data.applicantActionId,
      externalApplicantActionId: data.externalApplicantActionId,
      clientId: data.clientId,
    };
  }

  // -----------------------------------------------------------------------
  // Internal helpers
  // -----------------------------------------------------------------------

  /**
   * Make an authenticated JSON request to the Sumsub API.
   */
  private async request(
    path: string,
    body: Record<string, unknown> | null,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' = body ? 'POST' : 'GET',
  ): Promise<any> {
    const url = `${this.baseUrl}${path}`;
    const ts = Math.floor(Date.now() / 1000);
    const jsonBody = body ? JSON.stringify(body) : '';

    const signature = this.signRequest(method, path, ts, jsonBody);

    const headers: Record<string, string> = {
      'X-App-Token': this.appToken,
      'X-App-Access-Ts': String(ts),
      'X-App-Access-Sig': signature,
    };

    if (body) {
      headers['Content-Type'] = 'application/json';
    }

    const response = await fetch(url, {
      method,
      headers,
      body: body ? jsonBody : undefined,
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(
        `Sumsub API error ${response.status} ${response.statusText}: ${errorBody}`,
      );
    }

    return response.json();
  }

  /**
   * Make a raw (non-JSON) request — used for multipart uploads.
   */
  private async requestRaw(
    path: string,
    body: Buffer,
    method: 'POST' | 'PUT',
    extraHeaders: Record<string, string>,
  ): Promise<any> {
    const url = `${this.baseUrl}${path}`;
    const ts = Math.floor(Date.now() / 1000);
    const signature = this.signRequest(method, path, ts, body);

    const response = await fetch(url, {
      method,
      headers: {
        'X-App-Token': this.appToken,
        'X-App-Access-Ts': String(ts),
        'X-App-Access-Sig': signature,
        ...extraHeaders,
      },
      body: body as any,
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(
        `Sumsub API error ${response.status} ${response.statusText}: ${errorBody}`,
      );
    }

    return response.json();
  }

  /**
   * Sumsub uses HMAC-SHA1 signing: HMAC(method + path + timestamp + body).
   */
  private signRequest(
    method: string,
    path: string,
    ts: number,
    body: string | Buffer,
  ): string {
    const data = `${ts}${method.toUpperCase()}${path}${body}`;
    return crypto
      .createHmac('sha1', this.apiToken)
      .update(data)
      .digest('hex');
  }

  /**
   * Convert Sumsub metadata array [{key, value}] to a flat record.
   */
  private flattenMetadata(
    metadata: Array<{ key: string; value: string }> | undefined,
  ): Record<string, string> | undefined {
    if (!metadata) return undefined;
    const result: Record<string, string> = {};
    for (const item of metadata) {
      result[item.key] = item.value;
    }
    return result;
  }

  /**
   * Return a mock applicant when credentials are not configured.
   */
  private mockApplicant(params: CreateApplicantParams): ApplicantResult {
    const applicantId = `mock-${crypto.randomBytes(12).toString('hex')}`;
    this.logger.debug(`Created mock applicant ${applicantId}`);
    return {
      applicantId,
      status: 'init',
      createdAt: new Date().toISOString(),
      info: params.info as ApplicantResult['info'],
      metadata: params.metadata,
    };
  }
}
