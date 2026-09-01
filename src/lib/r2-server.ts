import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export const r2Namespaces = [
  "shipment-documents",
  "shipment-exception-documents",
  "driver-documents",
  "vehicle-documents",
  "purchase-invoice-documents",
] as const;

export type R2Namespace = (typeof r2Namespaces)[number];

function required(name: string) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Eksik R2 sunucu ayarı: ${name}`);
  return value;
}

function config() {
  const accountId = required("R2_ACCOUNT_ID");
  return {
    bucket: required("R2_BUCKET_NAME"),
    endpoint: process.env.R2_ENDPOINT?.trim() || `https://${accountId}.r2.cloudflarestorage.com`,
    accessKeyId: required("R2_ACCESS_KEY_ID"),
    secretAccessKey: required("R2_SECRET_ACCESS_KEY"),
  };
}

function client() {
  const value = config();
  return new S3Client({
    region: "auto",
    endpoint: value.endpoint,
    credentials: {
      accessKeyId: value.accessKeyId,
      secretAccessKey: value.secretAccessKey,
    },
  });
}

export function isR2Namespace(value: unknown): value is R2Namespace {
  return typeof value === "string" && r2Namespaces.includes(value as R2Namespace);
}

export function safeR2Path(value: unknown) {
  if (typeof value !== "string") throw new Error("R2 nesne yolu geçersiz.");
  const path = value.trim().replace(/^\/+/, "");
  if (!path || path.length > 900 || path.includes("\\") || path.split("/").some((part) => !part || part === "." || part === "..")) {
    throw new Error("R2 nesne yolu geçersiz.");
  }
  return path;
}

function objectKey(namespace: R2Namespace, path: string) {
  return `${namespace}/${safeR2Path(path)}`;
}

export async function createR2UploadUrl(namespace: R2Namespace, path: string, contentType: string) {
  const value = config();
  return getSignedUrl(
    client(),
    new PutObjectCommand({
      Bucket: value.bucket,
      Key: objectKey(namespace, path),
      ContentType: contentType,
    }),
    { expiresIn: 300 },
  );
}

export async function createR2DownloadUrl(namespace: R2Namespace, path: string) {
  const value = config();
  return getSignedUrl(
    client(),
    new GetObjectCommand({ Bucket: value.bucket, Key: objectKey(namespace, path) }),
    { expiresIn: 300 },
  );
}

export async function deleteR2Object(namespace: R2Namespace, path: string) {
  const value = config();
  await client().send(new DeleteObjectCommand({ Bucket: value.bucket, Key: objectKey(namespace, path) }));
}

export async function downloadR2Object(namespace: R2Namespace, path: string) {
  const value = config();
  const result = await client().send(new GetObjectCommand({ Bucket: value.bucket, Key: objectKey(namespace, path) }));
  if (!result.Body) throw new Error("R2 belgesi indirilemedi.");
  return Buffer.from(await result.Body.transformToByteArray());
}
