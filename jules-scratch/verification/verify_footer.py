import asyncio
from playwright.sync_api import sync_playwright, expect
import os

def run_verification():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Get the absolute path to index.html
        current_dir = os.getcwd()
        file_path = os.path.join(current_dir, 'index.html')
        page.goto(f'file://{file_path}')

        # Wait for the loading animation to disappear, indicating the sidebar is loaded
        loading_placeholder = page.locator(".animate-pulse")
        expect(loading_placeholder.first).to_be_hidden()

        # 1. Expand the "Calculadoras" section
        calculadoras_section = page.locator("summary", has_text="Calculadoras")
        expect(calculadoras_section).to_be_visible()
        calculadoras_section.click()

        # 2. Navigate to the "Férias" calculator
        ferias_button = page.get_by_role("button", name="Férias")
        expect(ferias_button).to_be_visible()
        ferias_button.click()

        # 3. Fill in the form
        salario_input = page.locator("#ferias-salarioBruto")
        expect(salario_input).to_be_visible()
        salario_input.fill("5000.00")

        # 4. Click calculate
        calculate_button = page.locator('[data-action="calculate-now"][data-calc="ferias"]')
        expect(calculate_button).to_be_visible()
        calculate_button.click()

        # 5. Wait for results and take a screenshot
        results_container = page.locator("#ferias-results")
        expect(results_container).to_be_visible()

        # Check if the legal notice is present
        legal_notice_text = "Valores aproximados para orientação, não substitui assessoria jurídica."
        legal_notice_element = results_container.get_by_text(legal_notice_text, exact=False)
        expect(legal_notice_element).to_be_visible()

        # Take screenshot of the results card
        results_container.screenshot(path="jules-scratch/verification/verification.png")

        browser.close()

if __name__ == "__main__":
    run_verification()