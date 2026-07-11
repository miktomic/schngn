-- Forward-only cleanup for databases that applied the retired waitlist migration.
-- Fresh databases start with migration 0002; existing ledgers keep their original
-- migration names and apply this idempotent drop without touching account data.
drop table if exists waitlist_signups;
