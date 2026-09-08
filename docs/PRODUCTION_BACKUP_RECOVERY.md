# RideSetu — Production Database Backup & Disaster Recovery Plan

> **Database**: MongoDB Atlas M10+ Dedicated Cluster  
> **Recovery Time Objective (RTO)**: < 1 Hour  
> **Recovery Point Objective (RPO)**: < 1 Minute (Continuous Point-in-Time Recovery)

---

## 1. Backup Strategy & Frequency

1. **Continuous Oplog Archiving**:
   - MongoDB Atlas continuously streams write operations (oplog) to automated backup storage.
   - Enables continuous **Point-in-Time Recovery (PITR)** down to the exact second.
2. **Automated Daily Snapshots**:
   - Daily automated database snapshots retained for 30 days.
   - Weekly snapshots retained for 90 days.
   - Monthly snapshots retained for 1 year.
3. **Multi-Region Cross-Cluster Snapshots**:
   - Automated snapshot replication to a secondary cloud region (AWS ap-south-1 / Mumbai to ap-southeast-1 / Singapore).

---

## 2. Point-in-Time Restore Procedure

In the event of accidental data corruption or catastrophic failure:

1. **Navigate to MongoDB Atlas Console**:
   - Select **Cluster0** → Click **Backup** tab.
2. **Initiate Point-in-Time Restore**:
   - Click **Restore** → Choose **Point-in-Time Recovery**.
   - Select the exact date and timestamp immediately prior to the incident (e.g. `2026-08-22 16:45:00 UTC`).
3. **Restore Target**:
   - Restore to a **New Cluster** (e.g. `Cluster0-Restored`) to prevent overwriting active investigation logs.
4. **Validation & Cutover**:
   - Verify document counts across `users`, `vendors`, `vehicles`, `bookings`, `payments`, `payouts`, `notifications`, and `trip_locations`.
   - Update `MONGODB_URI` in Vercel environment variables to point to `Cluster0-Restored`.
   - Redeploy application in Vercel.

---

## 3. Disaster Recovery Plan

| Scenario | Severity | Action | Target RTO |
| :--- | :--- | :--- | :--- |
| **Accidental Collection Deletion** | HIGH | Perform PITR restore of target collection to staging cluster and re-insert documents. | 30 Mins |
| **Primary Region Outage** | CRITICAL | Atlas automated failover elects new Primary in secondary region within 10-30 seconds. Application automatically reconnects via replica set connection string. | < 1 Min |
| **Data Corruption / Malicious Modification** | CRITICAL | Freeze write operations via Maintenance Mode flag, execute PITR restore to 1 second before event, verify transaction log integrity, and cut over connection string. | 45 Mins |
