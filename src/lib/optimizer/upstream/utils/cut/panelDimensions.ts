/** 입력 중인 빈 행은 목록에 보존하되 배치·재단·가공비 산정에서는 제외한다. */
export function hasPanelDimensions(panel: { width: number; height: number }): boolean {
  return Number.isFinite(panel.width) && panel.width > 0
    && Number.isFinite(panel.height) && panel.height > 0;
}

/** 판재는 양의 정수 개수만 제조·배치한다. 잘못된 수량은 견적에서 미확정으로 알린다. */
export function panelQuantity(quantity: number): number {
  return Number.isSafeInteger(quantity) && quantity > 0 ? quantity : 0;
}
