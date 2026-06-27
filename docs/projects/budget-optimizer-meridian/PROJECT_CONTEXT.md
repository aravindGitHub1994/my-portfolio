# Marketing Mix Modeling (MMM) - Global Project Context

## Project Mission
To provide data-driven insights and budget optimization strategies across various markets and media channels using state-of-the-art MMM frameworks. This context serves as a baseline for all MMM budget optimizing using meridian projects within the folder C:\Users\AravindKumar\Documents\Local_server\MMM\Meridian - budgetOptimizer.

## Tech Stack
- **Core Library**: [Google Meridian](https://github.com/google/meridian) (Bayesian MMM)
- **Probabilistic Backend**: JAX, TensorFlow Probability (TFP)
- **Data Engineering**: Pandas, NumPy, Xarray (Multidimensional Data Selection)
- **Visualization**: Altair (via Meridian's HTML report)
- **Environment**: Google Colab (Recommended for high-compute MCMC sampling)

## Standard Workflow
1. **Data Ingestion & Cleaning**:
    - Handle missing weeks via imputation (ensure KPI and Spend alignment).
    - Identify and report anomalies/spikes (>10x mean).
2. **Data Alignment**:
    - Use Xarray to create a consistent Geo-Time panel.
    - Standardize dates to ISO format (`%Y-%m-%d`).
3. **Model Specification**:
    - Define KPI type (Revenue vs. Conversions).
    - Set media priors (typically ROI-based).
    - Configure splines (knots) for time-effect capture.
4. **MCMC Sampling**:
    - Typically 4 chains, 500 adapt, 500 burn-in, 1000 keep.
5. **Optimization**:
    - Run `BudgetOptimizer` for fixed or flexible budget scenarios.
    - Apply channel-level spend constraints (e.g., +/- 30%).
6. **Reporting**:
    - Generate visual HTML reports for stakeholders.
    - Export numerical recommendations to Excel.

## Technical Best Practices & Defaults
### 1. Model Fit & Diagnostics
- **MCMC Chains**: 4 chains (Industry standard for convergence validation).
- **Iterations**: 500 adapt, 500 burn-in, 1000 keep (Total 2000 per chain).
- **Target Metrics**: 
    - **R-hat**: Must be **< 1.1** for all parameters (ensures chains have converged).
    - **ESS (Effective Sample Size)**: Should be **> 400** to ensure stable posterior estimates.
- **Time Spline (Knots)**: Start with 1 knot per 10-15 weeks. (e.g., 10 knots for 170+ weeks).

### 2. Priors & Parameters
- **Media Prior Type**: Prefer `'roi'`. This reparameterizes the model to set priors directly on ROI, making them business-interpretable.
- **Default Distributions**: 
    - **Revenue KPI**: Defaults to **Log-Normal(0.2, 0.9)**. This implies a prior mean ROI of 1.83 and a median of 1.22.
    - **Non-Revenue KPI**: Focuses on "Total Paid Media Contribution" (typically 40% mean).
- **Hill & Adstock**: Use Geometric decay and Hill saturation as defaults; allow the MCMC process to learn the specific shapes from historical data.

## Key Learnings & "Gotchas" (from Autodesk Project C:\Users\AravindKumar\Documents\Local_server\MMM\Autodesk)
- **API Volatility**: Meridian is in active development. Methods like `get_optimizer()` or attributes like `summary_table` are frequently deprecated. Always use the class-based `optimizer.BudgetOptimizer(mmm)` and access raw data via `optimized_data` and `nonoptimized_data`.
- **Method Signatures**: `output_optimization_summary` requires both `filename` and `filepath`.
- **Xarray Dimensions**: Meridian is very strict about dimension naming. KPI must be `['geo', 'time']`, Media must be `['geo', 'media_time', 'media_channel']`, and Spend must be `['geo', 'time', 'media_channel']`.
- **Indentation Safety**: When transferring code between documents and Colab, ensure no leading indentation is introduced, as this breaks Python syntax.
- **Data Alignment**: Even 1 extra week in one market can cause matrix dimension errors. Always force alignment across all Markets to a common subset of weeks.

## Output Verification Process
- **Convergence**: Check R-hat values for MCMC sampling (should be close to 1.0).
- **Logic Check**: Ensure optimized budget totals match non-optimized totals in fixed-budget scenarios.
- **ROI Stability**: Verify that optimized ROI is higher than or equal to non-optimized ROI.
- **Response Curves**: Inspect curves in the HTML report to ensure spend is not being pushed too far into diminishing returns.
