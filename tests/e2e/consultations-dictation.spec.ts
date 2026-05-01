import { expect, test, type Locator, type Page } from "@playwright/test";

const seedAuthenticatedSession = async (page: Page) => {
  await page.addInitScript(() => {
    localStorage.setItem("auth_token", "test-token");
    localStorage.setItem(
      "auth_user",
      JSON.stringify({
        id: 1,
        name: "Admin",
        email: "admin@saluki.local",
        roles: [{ code: "ADMIN" }],
      }),
    );
  });
};

const parseMultipartPayload = async (pageRequest: {
  headerValue(name: string): Promise<string | null>;
  postData(): string | null;
  postDataJSON(): any;
}) => {
  const contentType = (await pageRequest.headerValue("content-type")) || "";
  if (!contentType.includes("multipart/form-data")) {
    return pageRequest.postDataJSON();
  }

  const boundaryMatch = contentType.match(/boundary=(.+)$/);
  const boundary = boundaryMatch?.[1];
  const rawBody = pageRequest.postData() || "";
  if (!boundary || !rawBody) {
    return {};
  }

  const fields: Record<string, string> = {};
  const parts = rawBody.split(`--${boundary}`);

  for (const part of parts) {
    const nameMatch = part.match(/name="([^"]+)"/);
    if (!nameMatch) continue;
    if (part.includes('filename="')) continue;

    const value = part
      .split("\r\n\r\n")
      .slice(1)
      .join("\r\n\r\n")
      .replace(/\r\n--?$/, "")
      .trim();

    fields[nameMatch[1]] = value;
  }

  return fields;
};

const selectOption = async (
  scope: Locator,
  page: Page,
  label: string,
  optionText: string,
) => {
  const formItem = scope.locator(".n-form-item", { hasText: label }).first();
  await formItem.locator(".n-base-selection").click();
  await page.getByText(optionText, { exact: true }).last().click();
};

test.describe("Consulta com anamnese assistida", () => {
  test("should keep the new consultation modal in assisted mode and apply automatic suggestions", async ({
    page,
  }) => {
    await seedAuthenticatedSession(page);

    let dictationPosted = false;
    let createdConsultationPayload: any = null;
    let lastDictationPayload: any = null;

    await page.route("**/api/v1/users**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          data: [{ id: 1, name: "Dra. Camila" }],
          meta: { total: 1 },
        }),
      });
    });

    await page.route("**/api/v1/clients**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          data: [{ id: 10, name: "Ana Paula" }],
          meta: { total: 1 },
        }),
      });
    });

    await page.route("**/api/v1/pets**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          data: [{ id: 22, clientId: 10, name: "Rex" }],
          meta: { total: 1 },
        }),
      });
    });

    await page.route("**/api/v1/appointments**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          data: [],
          meta: { total: 0 },
        }),
      });
    });

    await page.route("**/api/v1/consultations?**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          data: createdConsultationPayload
            ? [
                {
                  id: 15,
                  clientId: 10,
                  petId: 22,
                  veterinarianId: 1,
                  visitDate: createdConsultationPayload.visitDate,
                  mainComplaint: createdConsultationPayload.mainComplaint,
                  clinicalFindings: "",
                  diagnosis: "",
                  treatmentPlan: "",
                  notes: "",
                },
              ]
            : [],
          meta: { total: createdConsultationPayload ? 1 : 0 },
        }),
      });
    });

    await page.route("**/api/v1/consultations", async (route) => {
      if (route.request().method() !== "POST") {
        await route.fallback();
        return;
      }

      createdConsultationPayload = route.request().postDataJSON();
      await route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify({
          id: 15,
          clientId: createdConsultationPayload.clientId,
          petId: createdConsultationPayload.petId,
          veterinarianId: createdConsultationPayload.veterinarianId,
          visitDate: createdConsultationPayload.visitDate,
          weightKg: createdConsultationPayload.weightKg,
          temperatureC: createdConsultationPayload.temperatureC,
          mainComplaint: createdConsultationPayload.mainComplaint,
          clinicalFindings: "",
          diagnosis: "",
          treatmentPlan: "",
          notes: "",
        }),
      });
    });

    await page.route("**/api/v1/consultations/15/dictations", async (route) => {
      const method = route.request().method();

      if (method === "POST") {
        dictationPosted = true;
        lastDictationPayload = await parseMultipartPayload(route.request());
        await route.fulfill({
          status: 201,
          contentType: "application/json",
          body: JSON.stringify({
            id: 100,
            consultationId: 15,
            status: "PENDING",
            transcriptDraft: lastDictationPayload.transcriptDraft,
          }),
        });
        return;
      }

      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          data: dictationPosted
            ? [
                {
                  id: 100,
                  consultationId: 15,
                  status: "COMPLETED",
                  transcriptDraft: lastDictationPayload.transcriptDraft,
                  transcriptFinal:
                    "Tutor relata vômito e apatia desde ontem. Ao exame temperatura 39,4 e desidratação leve. Suspeita de gastroenterite. Conduta com antiemético e retorno em 48h.",
                  structuredPayload: {
                    summary:
                      "Suspeita de gastroenterite com conduta sintomática.",
                    mainComplaint: "Vômito e apatia desde ontem.",
                    clinicalFindings: "Temperatura 39,4 e desidratação leve.",
                    diagnosis: "Suspeita de gastroenterite.",
                    treatmentPlan: "Antiemético, dieta leve e retorno em 48h.",
                    notes: "Tutor orientado sobre sinais de alerta.",
                    weightKg: null,
                    temperatureC: 39.4,
                  },
                },
              ]
            : [],
        }),
      });
    });

    await page.goto("/atendimento/consultas");

    await expect(
      page.getByRole("heading", { name: "Consultório Clínico" }),
    ).toBeVisible();

    await page.getByRole("button", { name: "Registrar Consulta" }).click();
    await expect(page.getByText("Novo Atendimento")).toBeVisible();

    const form = page.locator(".consultation-form");

    await selectOption(form, page, "Cliente", "Ana Paula");
    await selectOption(form, page, "Paciente", "Rex");
    await selectOption(form, page, "Veterinário Responsável", "Dra. Camila");

    await form
      .getByPlaceholder(
        "Descreva ou dite a queixa do paciente (ex: vômito há 2 dias...)",
      )
      .fill(
        "Tutor relata vômito e apatia desde ontem. Ao exame temperatura 39,4 e desidratação leve. Suspeita de gastroenterite. Conduta com antiemético e retorno em 48h.",
      );

    await form
      .getByRole("button", { name: "Iniciar Atendimento Clínico" })
      .click();

    await expect(
      page.getByRole("heading", { name: "Anamnese Assistida", exact: true }),
    ).toBeVisible();
    await expect
      .poll(() => Boolean(createdConsultationPayload))
      .toBeTruthy();
    await expect
      .poll(() => dictationPosted)
      .toBeTruthy();

    expect(createdConsultationPayload).toMatchObject({
      clientId: 10,
      petId: 22,
      veterinarianId: 1,
      mainComplaint: expect.stringContaining("gastroenterite"),
    });

    expect(lastDictationPayload).toMatchObject({
      transcriptDraft: expect.stringContaining("gastroenterite"),
      captureSource: "MANUAL_TEXT",
      language: "pt-BR",
    });

    await expect(page.getByText("Sugestões automáticas")).toBeVisible();
    await form.getByRole("button", { name: "Aplicar sugestões" }).click();

    await expect(
      form.getByPlaceholder(
        "Descreva ou dite a queixa do paciente (ex: vômito há 2 dias...)",
      ),
    ).toHaveValue(/Vômito e apatia/i);
    await expect(
      form.getByPlaceholder("Hipótese diagnóstica ou diagnóstico confirmado"),
    ).toHaveValue(/gastroenterite/i);
    await expect(form.getByPlaceholder("Ex: 38.5")).toHaveValue("39.4");
  });
});
