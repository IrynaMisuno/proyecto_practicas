// Se ejecuta antes de cada archivo de test.
import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

// Desmonta lo pintado en cada test para que no afecte al siguiente.
afterEach(() => cleanup());
