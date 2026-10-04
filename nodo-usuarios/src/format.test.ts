import { describe, expect, it } from "vitest";
import { compareByName, formatDate, getInitials } from "./format";

describe("getInitials", () => {
  it("usa las dos primeras palabras en mayúsculas", () => {
    expect(getInitials("ana maría pérez")).toBe("AM");
  });

  it("ignora los espacios de más", () => {
    expect(getInitials("  Luis   ")).toBe("L");
  });
});

describe("formatDate", () => {
  it("formatea en español", () => {
    expect(formatDate("2026-03-05T12:00:00Z")).toBe("05 mar 2026");
  });
});

describe("compareByName", () => {
  it("ordena con las reglas del español", () => {
    const names = [{ name: "Óscar" }, { name: "Nuria" }, { name: "Ñandú" }].sort(compareByName).map((item) => item.name);

    expect(names).toEqual(["Nuria", "Ñandú", "Óscar"]);
  });
});
