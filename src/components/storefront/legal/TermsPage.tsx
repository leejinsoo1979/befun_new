import Link from 'next/link';
import { termsCompany, termsGroups, termsRevision } from './terms';
import styles from './terms.module.css';

function TermsContents() {
  return (
    <ol className={styles.contentsList}>
      {termsGroups.map((group, index) => (
        <li key={group.id}>
          <a href={`#${group.id}`}>
            <span className={styles.contentsNumber}>{String(index + 1).padStart(2, '0')}</span>
            <span>{group.title}<small>{group.description}</small></span>
          </a>
        </li>
      ))}
    </ol>
  );
}

export function TermsPage() {
  return (
    <div className={styles.page} data-befun-terms>
      <header className={styles.heading} id="terms-top">
        <nav className={styles.breadcrumbs} aria-label="현재 위치">
          <Link href="/">홈</Link><span aria-hidden="true">/</span>
          <Link href="/faq">고객 지원</Link><span aria-hidden="true">/</span>
          <span aria-current="page">이용약관</span>
        </nav>
        <p className={styles.eyebrow}>BEFUN HELP</p>
        <h1>이용약관</h1>
        <p className={styles.lead}>내 공간에 맞춘 가구를 만드는 과정,<br />그 안에서 지켜야 할 약속을 안내합니다.</p>
        <div className={styles.version}>
          <span className={styles.draftLabel}>검토용 초안</span>
          <span>작성 기준 <time dateTime={termsRevision}>2026.10.16</time></span>
          <span>시행일 확정 전</span>
        </div>
      </header>

      <div className={styles.layout}>
        <aside className={styles.sidebar}>
          <nav className={styles.desktopContents} aria-label="이용약관 목차">
            <p className={styles.contentsTitle}>목차</p>
            <TermsContents />
            <a className={styles.sidebarContact} href={`mailto:${termsCompany.email}`}>약관 문의 ↗</a>
          </nav>
          <details className={styles.mobileContents}>
            <summary>약관 목차 <span aria-hidden="true">＋</span></summary>
            <nav aria-label="모바일 이용약관 목차"><TermsContents /></nav>
          </details>
        </aside>

        <div className={styles.body}>
          <div className={styles.draftNotice}>
            <strong>적용 전 검토 중인 약관입니다.</strong>
            <p>BEFUN의 맞춤 가구 서비스에 맞춰 작성한 초안입니다. 사업자 필수 정보, 제작·배송 운영 기준과 시행일을 확정한 후 적용합니다.</p>
          </div>

          <section className={styles.overview} aria-labelledby="terms-overview">
            <p className={styles.eyebrow}>먼저 확인하세요</p>
            <h2 id="terms-overview">주문 전 알아둘 세 가지</h2>
            <div className={styles.summaryGrid}>
              <a href="#terms-configurator"><span>01</span><h3>최종 사양 확인</h3><p>저장한 디자인과 실제 주문 사양을 확인해 주세요. 주문 후 디자인 변경은 자동 반영되지 않습니다.</p></a>
              <a href="#terms-custom-withdrawal"><span>02</span><h3>주문 제작과 취소</h3><p>맞춤 제작이라는 이유만으로 반품을 금지하지 않습니다. 법정 요건과 거래별 별도 동의를 따릅니다.</p></a>
              <a href="#terms-refunds"><span>03</span><h3>하자와 환급</h3><p>하자·오배송은 회사가 반환 비용을 부담합니다. 법정 청약철회에 별도 위약금을 청구하지 않습니다.</p></a>
            </div>
            <p className={styles.summaryNote}>위 내용은 핵심 안내이며, 구체적인 조건과 권리는 아래 약관 본문에서 확인할 수 있습니다.</p>
          </section>

          <article aria-label="BEFUN 이용약관 본문">
            {termsGroups.map((group, groupIndex) => (
              <section className={styles.group} id={group.id} key={group.id} aria-labelledby={`${group.id}-title`}>
                <div className={styles.groupHeading}>
                  <span>{String(groupIndex + 1).padStart(2, '0')}</span>
                  <h2 id={`${group.id}-title`}>{group.title}</h2>
                </div>
                {group.articles.map(article => (
                  <section className={styles.article} id={article.id} key={article.id} aria-labelledby={`${article.id}-title`}>
                    <h3 id={`${article.id}-title`}>{article.title}</h3>
                    <ol>{article.clauses.map(clause => <li key={clause}>{clause}</li>)}</ol>
                  </section>
                ))}
              </section>
            ))}
            <section className={styles.supplement} aria-labelledby="terms-effective-date">
              <h2 id="terms-effective-date">부칙 · 시행일</h2>
              <p>이 초안의 시행일은 아직 정해지지 않았습니다. 확정된 약관은 시행일과 함께 게시하며, 기존 이용자에게 적용하는 경우 필요한 사전 고지와 동의 절차를 진행합니다.</p>
            </section>
          </article>

          <section className={styles.company} aria-labelledby="terms-company-title">
            <h2 id="terms-company-title">BEFUN 운영자</h2>
            <dl>
              <div><dt>상호</dt><dd>{termsCompany.name}</dd></div>
              <div><dt>대표자</dt><dd>{termsCompany.representative}</dd></div>
              <div><dt>주소</dt><dd>{termsCompany.address}</dd></div>
              <div><dt>이메일</dt><dd><a href={`mailto:${termsCompany.email}`}>{termsCompany.email}</a></dd></div>
            </dl>
            <p>사업자등록번호, 통신판매업 신고번호와 고객센터 전화번호 등 필수 정보는 확인 후 확정본에 반영합니다. 위 주소는 운영자 주소이며, 상품 반송 전에는 별도로 안내받은 반품 주소를 확인해 주세요.</p>
          </section>

          <div className={styles.related}>
            <Link href="/privacy_policy">개인정보 처리방침 ↗</Link>
            <a href="https://www.kca.go.kr/odr/cm/cm/faq.do" target="_blank" rel="noreferrer">한국소비자원 피해구제 ↗</a>
            <a href="#terms-top">맨 위로 ↑</a>
          </div>
        </div>
      </div>
    </div>
  );
}
