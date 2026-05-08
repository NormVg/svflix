import "dotenv/config";
import { db } from "./client";
import { appUsers, categories } from "./schema";

const parseUsers = () => {
  const usersRaw = process.env.APP_AUTH_USERS || "";
  return usersRaw
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
};

const titleize = (value: string) =>
  value
    .replace(/[._-]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());

const run = async () => {
  const usernames = parseUsers();
  if (!usernames.length) {
    throw new Error("APP_AUTH_USERS is required to seed app_users.");
  }

  await db
    .insert(appUsers)
    .values(
      usernames.map((username) => ({
        username,
        displayName: titleize(username),
      })),
    )
    .onConflictDoNothing({ target: appUsers.username });

  await db
    .insert(categories)
    .values([
      { slug: "dates", name: "Dates", description: "Date memories and outings" },
      { slug: "travel", name: "Travel", description: "Trips and vacations" },
      { slug: "daily-life", name: "Daily Life", description: "Everyday moments" },
      { slug: "special-days", name: "Special Days", description: "Birthdays and celebrations" },
    ])
    .onConflictDoNothing({ target: categories.slug });

  console.log(`Seed complete. users=${usernames.length}, categories=4`);
};

run()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    process.exit();
  });
