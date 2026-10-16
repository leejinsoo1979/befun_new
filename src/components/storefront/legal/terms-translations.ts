import type { Locale } from '@/lib/i18n/regions';
import { translate } from '@/lib/i18n/messages';
import { termsGroups, type TermsGroup } from './terms';

type ArticleTranslation = { title: readonly [string, string]; clauses: readonly (readonly [string, string])[] };

export const translatedArticles: Record<string, ArticleTranslation> = {
  "terms-purpose": {
    "title": [
      "Article 1 · Purpose and scope",
      "第1条・目的と適用範囲"
    ],
    "clauses": [
      [
        "These terms set out the rights, obligations, responsibilities and procedures of Uable Corporation (the “Company”) and users in connection with the BEFUN online store and furniture design service (the “Store”) operated by the Company, and transactions in its products.",
        "この規約は、Uable Corporation（以下「会社」）が運営するBEFUNオンラインショップおよび家具デザインサービス（以下「ショップ」）の利用と商品取引に関する会社と利用者の権利・義務、責任および手続きを定めます。"
      ],
      [
        "These terms apply regardless of access device, including computers and mobile devices. Provisions appropriate to their nature apply to services available without registration. Services requiring login or a separate contract are explained on the relevant screen.",
        "この規約は、PCやモバイルなどの接続機器を問わず適用されます。会員登録なしで利用できるサービスには、その性質に適した条項を適用し、ログインや別途契約が必要なサービスは該当画面で案内します。"
      ],
      [
        "Product-specific transaction conditions and separate agreements apply to the extent reviewed and accepted by the user before ordering. Conditions that conflict with mandatory laws or unfairly disadvantage consumers do not apply.",
        "個別商品の取引条件や別途の合意は、利用者が注文前に確認し同意した範囲で適用されます。法令の強行規定に反する条件や、消費者に不当に不利な条件は適用しません。"
      ]
    ]
  },
  "terms-definitions": {
    "title": [
      "Article 2 · Definitions",
      "第2条・用語の定義"
    ],
    "clauses": [
      [
        "“User” means members and non-members who access and use the Store. “Member” means a person who creates an account and uses membership services provided by the Company.",
        "「利用者」とは、ショップにアクセスしてサービスを利用する会員および非会員をいい、「会員」とは、アカウントを作成して会社が提供する会員サービスを利用する人をいいます。"
      ],
      [
        "“Configurator” means the design tool for choosing available options such as furniture dimensions, materials, colours, shelves, doors and drawers, and viewing the expected appearance and price. “Design” means a configuration selected or saved by a user in that tool.",
        "「カスタマイザー」とは、家具のサイズ、素材、カラー、棚・扉・引き出しなどの選択可能なオプションを選び、外観や価格の見込みを確認するデザインツールをいいます。「デザイン」とは、利用者がこのツールで選択または保存した構成をいいます。"
      ],
      [
        "“Products” means goods or services offered for sale in the Store, including furniture, parts and material samples. “Made-to-order products” means products individually manufactured to a user’s order specifications. This designation alone does not restrict statutory withdrawal rights.",
        "「商品」とは、家具、部品、素材サンプルなど、ショップで販売する取引対象の物品またはサービスをいいます。「受注製作商品」とは、利用者の注文仕様に従って個別に製作する商品をいい、この名称だけで法定の申込み撤回が制限されるものではありません。"
      ]
    ]
  },
  "terms-business": {
    "title": [
      "Article 3 · Business details and transaction information",
      "第3条・運営者情報と取引条件の案内"
    ],
    "clauses": [
      [
        "The Store is operated by Uable Corporation, represented by Jinsoo Lee, at 5F, 7 Eonju-ro 97-gil, Gangnam-gu, Seoul, Republic of Korea. The contact email is contact@befun.co.kr.",
        "ショップの運営者はUable Corporation、代表者はJinsoo Lee、所在地は大韓民国ソウル市江南区彦州路97キル7、5階、お問い合わせメールはcontact@befun.co.krです。"
      ],
      [
        "The Company displays legally required business information, including its name, representative, business address, telephone and email, business registration number and mail-order business registration number, so users can easily find it. A separate return or exchange address is provided if it differs from the business address.",
        "会社は、商号、代表者、事業所住所、電話番号・メールアドレス、事業者登録番号、通信販売業届出番号など、法定の事業者情報を利用者が容易に確認できるよう表示します。返品・交換先が事業所と異なる場合は、その住所を別途案内します。"
      ],
      [
        "Before ordering, the Company provides key specifications, prices and additional charges, payment methods, supply timing, delivery and installation conditions, and withdrawal, exchange, refund and aftercare conditions. Contract details are provided in a written or electronic form that users can retain or review.",
        "会社は注文前に、商品の主要仕様、価格と追加費用、決済方法、供給時期、配送・設置条件、申込み撤回・交換・返金およびアフターサービスの条件を案内し、契約内容を利用者が保存または確認できる書面もしくは電子文書で提供します。"
      ]
    ]
  },
  "terms-amendment": {
    "title": [
      "Article 4 · Publication and amendment of terms",
      "第4条・規約の掲載と変更"
    ],
    "clauses": [
      [
        "The Company publishes these terms in an easily accessible and savable form. Important matters, such as withdrawal restrictions and additional charges, are separately explained clearly before a contract is concluded.",
        "会社は、利用者が規約を容易に閲覧・保存できるよう掲載し、申込み撤回の制限や追加費用などの重要事項は、契約締結前に別途わかりやすく説明します。"
      ],
      [
        "When amending the terms, the Company posts the effective date, reasons and the before-and-after text at least 7 days before the effective date. Changes disadvantageous to users are posted at least 30 days in advance, and members are notified individually through their registered contact channels.",
        "規約を変更する場合は、適用日、変更理由、変更前後の内容を適用日の7日前から掲載します。利用者に不利な変更は少なくとも30日前に掲載し、会員には登録された連絡手段で個別に通知します。"
      ],
      [
        "Amended terms generally apply to contracts concluded on or after their effective date. Disadvantageous amendments do not apply retroactively to existing orders. Changes to ongoing membership services that require consent undergo a separate consent procedure. A user’s silence alone is not treated as consent.",
        "変更後の規約は、原則として適用日以降に締結する契約に適用します。成立済みの注文に不利な変更を遡及適用せず、継続利用中の会員サービスで同意が必要な変更には別途同意手続きを行います。利用者の沈黙だけで同意したとはみなしません。"
      ],
      [
        "Matters not addressed here follow applicable Korean laws, including the Act on Consumer Protection in Electronic Commerce, the Act on the Regulation of Terms and Conditions and the Civil Act, and lawful commercial practices.",
        "規約に定めのない事項は、大韓民国の電子商取引等における消費者保護に関する法律、約款の規制に関する法律、民法などの関係法令と適法な取引慣行に従います。"
      ]
    ]
  },
  "terms-services": {
    "title": [
      "Article 5 · Provision and interruption of services",
      "第5条・サービスの提供と中断"
    ],
    "clauses": [
      [
        "The Company provides services described in the Store, including product information, furniture design, saving and sharing designs, ordering and payment, order history and customer support. Saving or sharing a design or using the cart does not itself constitute a purchase contract or production request.",
        "会社は、商品情報、家具デザイン、デザインの保存・共有、注文・決済、注文履歴の確認、顧客サポートなど、ショップで案内するサービスを提供します。デザインの保存・共有やカートの利用自体は、購入契約や製作依頼を意味しません。"
      ],
      [
        "Services may be temporarily interrupted for maintenance, equipment replacement or communication failures. Planned interruptions are announced in advance. If an emergency prevents advance notice, reasons and restoration progress are communicated without delay.",
        "点検、設備交換、通信障害などによりサービスが一時中断する場合があります。予定された中断は事前に告知し、緊急の理由で事前告知が難しい場合は、その理由と復旧状況を遅滞なく案内します。"
      ],
      [
        "Future offerings may change because of product discontinuation or technical changes, but products or conditions under existing contracts are not changed without user consent. If performance is affected, the Company notifies users individually and takes necessary measures, such as performance, refunds or compensation, under applicable law and the contract.",
        "商品の販売終了や技術変更などにより今後の提供内容を変更することがありますが、成立済みの契約の商品や条件を利用者の同意なく変更しません。契約履行に影響する場合は個別に通知し、法令と契約に従って履行・返金・損害賠償など必要な措置を行います。"
      ],
      [
        "If services are terminated, the Company gives a reasonable preparation period and explains the end date and how orders and existing rights will be handled. Interruption or termination does not extinguish the Company’s existing contractual responsibilities.",
        "サービスを終了する場合は合理的な準備期間を設け、終了日と注文・保有する権利の取扱いを案内します。中断や終了だけで会社の既存の契約上の責任がなくなることはありません。"
      ]
    ]
  },
  "terms-registration": {
    "title": [
      "Article 6 · Registration and account management",
      "第6条・会員登録とアカウント管理"
    ],
    "clauses": [
      [
        "Users apply for membership by accurately entering the requested information and accepting these terms. The membership agreement is formed when the Company’s acceptance reaches the user.",
        "利用者は、登録画面で求める情報を正確に入力し、規約に同意して会員登録を申請します。会社の承諾が利用者に到達したときに会員利用契約が成立します。"
      ],
      [
        "The Company may refuse an application or request corrections for objective, reasonable grounds, including identity misuse, false information or threats to service security. The grounds for refusal are explained.",
        "会社は、他人の情報の不正利用、虚偽情報、サービスの安全性を損なう申請など、客観的かつ合理的な理由がある場合、登録を拒否したり補正を求めたりできます。拒否する場合はその理由を案内します。"
      ],
      [
        "If a minor concludes a purchase contract without a legal representative’s consent, the minor or representative may cancel it under applicable law. The Company follows required consent and information procedures when dealing with minors.",
        "未成年者が法定代理人の同意なく購入契約を締結した場合、本人または法定代理人は関係法令に従って契約を取り消すことができます。会社は未成年者との取引に必要な同意・案内手続きを遵守します。"
      ],
      [
        "Members must update changed contact information and securely manage passwords and external login accounts. Suspected account misuse must be reported to the Company. The Company does not shift responsibility for its own security negligence to members.",
        "会員は連絡先などが変わった場合に更新し、パスワードと外部ログインアカウントを安全に管理する必要があります。アカウントの不正利用を知ったときは会社に知らせる必要があり、会社のセキュリティ上の過失に関する責任を会員へ転嫁しません。"
      ]
    ]
  },
  "terms-withdraw-account": {
    "title": [
      "Article 7 · Membership withdrawal and restrictions",
      "第7条・退会と利用制限"
    ],
    "clauses": [
      [
        "Members may request withdrawal at any time, and the Company processes it without delay. Withdrawal does not extinguish rights and obligations relating to existing orders, refunds or defects. Transaction records are retained separately only as required by law.",
        "会員はいつでも退会を求めることができ、会社は遅滞なく処理します。退会しても成立済みの注文の履行、返金、不具合への対応などの権利・義務はなくなりません。取引記録は法定の保存義務がある範囲で分離保管します。"
      ],
      [
        "The Company may impose proportionate restrictions for violations of law or these terms, such as infringement of others’ rights, payment fraud, malware distribution or repeated disruption of services. Legitimate cancellation or return requests or negative reviews alone do not justify restriction.",
        "会社は、他人の権利侵害、決済の不正利用、悪意あるプログラムの配布、サービス障害の反復など、法令や規約に違反する行為に対して、違反の程度に比例した利用制限を行えます。正当なキャンセル・返品請求や否定的なレビューだけを理由に制限しません。"
      ],
      [
        "The Company gives advance notice of the reasons, scope, duration and appeal procedure. Security incidents or rights infringements requiring immediate action may be restricted first and notified without delay. Before terminating membership, the Company generally provides at least 30 days to respond.",
        "会社は制限の理由、範囲、期間と異議申立て方法を事前に通知します。即時対応が必要なセキュリティ事故や権利侵害では、先に制限してから遅滞なく通知できます。会員資格を剥奪する場合は、原則として少なくとも30日間の説明・弁明の機会を設けます。"
      ]
    ]
  },
  "terms-notices": {
    "title": [
      "Article 8 · Notices to users",
      "第8条・利用者への通知"
    ],
    "clauses": [
      [
        "The Company sends notices through agreed channels, such as the email registered to the account or provided with an order. Users must keep contact information at which they can actually receive notices.",
        "会社は、アカウントに登録された、または注文時に提供されたメールアドレスなど、合意した連絡手段で通知します。利用者は実際に受信できる情報を維持する必要があります。"
      ],
      [
        "General information common to all users may be posted in the Store for at least 7 days. Matters materially affecting rights, such as order conditions, delivery delays, refunds or account restrictions, are notified individually.",
        "利用者全体に共通する一般案内は、ショップに7日以上掲載する方法で通知できます。注文条件、配送遅延、返金、アカウント制限など、権利に重大な影響を与える事項は個別に通知します。"
      ],
      [
        "Separate statutory requirements for amendments, personal information processing or advertising communications are followed where applicable. Accepting these terms does not constitute consent to advertising.",
        "規約変更、個人情報の取扱い、広告情報の送信について別途法定要件がある場合は、その要件に従います。この規約への同意を広告受信の同意とはみなしません。"
      ]
    ]
  },
  "terms-configurator": {
    "title": [
      "Article 9 · Configurator and order specifications",
      "第9条・カスタマイザーと注文仕様"
    ],
    "clauses": [
      [
        "Before ordering, users must check overall dimensions, materials, colours, internal layout, door and drawer quantities and directions, bases and other available options, and order quantities. They must also check the installation space, access routes through doors, stairs or lifts, and surrounding fittings. The Company provides product information needed for these decisions and responds to enquiries.",
        "利用者は注文前に全体寸法、素材・カラー、内部構成、扉・引き出しの数量と向き、台座などのオプションと注文数量を確認する必要があります。設置空間、扉・階段・エレベーターなどの搬入経路、周囲の設備の寸法も確認してください。会社は判断に必要な商品情報を提供し、問い合わせに回答します。"
      ],
      [
        "3D views and images illustrate the design. Differences caused by monitors, lighting and natural material characteristics, and permitted manufacturing tolerances, are explained in advance for each product. Such explanations do not exempt the Company from responsibility for non-conforming specifications, incorrect colours or materials, or defects.",
        "3D画面や画像は、デザインを理解するための表現です。モニター、照明、素材の自然な特性による違いや許容される製作誤差は、商品ごとに事前に案内します。これらの案内によって、契約と異なる仕様、誤ったカラー・素材、不具合に関する会社の責任が免除されることはありません。"
      ],
      [
        "Production and supply are based on final specifications confirmed and agreed when ordering. Editing a saved design or shared link after ordering does not automatically amend order specifications. Changes follow Article 13.",
        "実際の製作・供給の基準は、注文時に確認し合意した最終仕様です。注文後に保存デザインや共有リンクを編集しても、注文仕様は自動変更されません。変更は第13条の手続きに従います。"
      ],
      [
        "Anyone receiving a shared link can view the design. Users should manage links with their sharing scope in mind and avoid including personal information, such as addresses or contact details, in design names or public posts.",
        "共有リンクを受け取った人はデザインを閲覧できます。利用者は共有範囲を考慮してリンクを管理し、デザイン名や公開投稿に住所・連絡先などの個人情報を含めないよう注意してください。"
      ]
    ]
  },
  "terms-purchase": {
    "title": [
      "Article 10 · Purchase applications and prior checks",
      "第10条・購入申込みと事前確認"
    ],
    "clauses": [
      [
        "Users apply to purchase after choosing products and final specifications, entering buyer, recipient and delivery details, and checking transaction conditions and the total payment. The Company provides a procedure to review the application, correct errors or stop the purchase.",
        "利用者は商品と最終仕様を選択し、注文者・受取人・配送先情報を入力したうえで、取引条件と支払総額を確認して購入を申し込みます。会社は申込内容の確認、誤りの訂正、購入の中止ができる手続きを提供します。"
      ],
      [
        "Delivery and installation charges, location-specific costs, production and delivery schedules and return-cost responsibilities are explained before payment. For costs that cannot be calculated in advance, the Company explains the calculation basis and confirmation procedure and does not charge additional amounts without separate consent.",
        "送料・設置費、地域・現場条件による費用、製作・配送日程、返品費用の負担基準は決済前に案内します。事前に算定できない費用は算定基準と確認手順を説明し、別途の同意なく追加請求しません。"
      ],
      [
        "Restrictions on withdrawal for made-to-order products require transaction-specific advance notice and written consent, including electronic documents, under Article 16. General acceptance of these terms or selection of options does not replace that process.",
        "受注製作商品の申込み撤回を制限する場合は、第16条に従い取引ごとの事前の個別告知と、電子文書などによる書面の同意が必要です。一般規約への同意やオプションの選択だけで代えることはできません。"
      ],
      [
        "Enquiries, quote requests, saving designs and adding products to the cart are not paid orders. For transactions requiring consultation, the Company and user confirm final specifications, price and supply conditions before concluding a contract.",
        "問い合わせ、見積依頼、デザインの保存、カートへの追加は有料の注文ではありません。相談が必要な取引では、会社と利用者が最終仕様・価格・供給条件を確認して契約を締結します。"
      ]
    ]
  },
  "terms-contract": {
    "title": [
      "Article 11 · Contract formation and order confirmation",
      "第11条・契約の成立と注文確認"
    ],
    "clauses": [
      [
        "On receiving a purchase application, the Company informs the user of its details and processing status. A purchase contract is formed when the user receives the Company’s acceptance after specifications, amounts and availability have been checked. Issuing an order number with payment pending does not itself constitute acceptance.",
        "会社は購入申込みを受け付けると、申込内容と処理状況を案内します。購入契約は、会社が商品仕様・金額と供給可否を確認して送る注文承諾通知が利用者に到達した時点で成立します。決済待ちの注文番号の発行だけでは承諾を意味しません。"
      ],
      [
        "The Company may refuse acceptance on reasonable grounds, such as false information, payment misuse or inability to supply, and explains its reasons. If supply becomes impossible after payment, the Company promptly refunds under applicable law.",
        "会社は虚偽情報、決済の不正利用、供給不能などの合理的な理由により承諾を拒否でき、その理由を知らせます。代金を受領後に供給できなくなった場合は、関係法令に従い速やかに返金します。"
      ],
      [
        "Order confirmation includes final specifications, quantities, total amount, payment status, supply conditions and change or cancellation procedures. The Company enables users to review order history and retain contract details.",
        "注文確認には最終仕様、数量、総額、決済状況、供給条件と変更・キャンセル方法を含めます。会社は利用者が注文履歴を確認し、契約内容を保存できるようにします。"
      ],
      [
        "If a price or specification error is found, the Company promptly notifies the user and consults on correction, performance or cancellation under applicable law. It does not unilaterally increase the price of an existing contract or demand additional payment.",
        "価格や仕様の誤りが見つかった場合、会社は直ちに通知し、法令に従って訂正・履行・キャンセルなどを協議します。成立済みの契約の価格を一方的に引き上げたり、追加決済を求めたりしません。"
      ]
    ]
  },
  "terms-payment": {
    "title": [
      "Article 12 · Prices and payment",
      "第12条・価格と代金の支払い"
    ],
    "clauses": [
      [
        "The currency and amount confirmed at checkout determine the product price. Domestic orders use Korean won (KRW). Tax inclusion and additional delivery or installation charges are shown separately before final payment. Reference quotes in other currencies alone do not establish an international delivery or payment contract.",
        "商品代金は注文画面で確定した通貨と金額に基づきます。韓国内の注文は韓国ウォン（KRW）を使用し、税の包含と配送・設置などの追加費用は最終決済前に区別して表示します。他通貨の参考見積だけで海外配送や決済の契約が成立するものではありません。"
      ],
      [
        "Users pay using one of the methods actually offered on the payment screen. The Company does not impose previously undisclosed fees merely because a particular payment method is chosen.",
        "利用者は決済画面で実際に提供される方法から選択して支払います。会社は、決済手段を選んだという理由だけで事前に案内していない手数料を課しません。"
      ],
      [
        "Where discounts, promotions or coupons are offered, eligibility, periods and conditions are separately explained. The Company does not arbitrarily withdraw benefits from validly concluded orders.",
        "割引、プロモーション、クーポンなどを実施する場合は、対象、期間、利用条件を別途案内します。会社は正常に成立した注文の特典を任意に撤回しません。"
      ],
      [
        "If products requiring separate conditions, such as gift cards, are sold, issuance, use, validity and balance-refund terms are separately explained before purchase. A product introduction page or enquiry feature alone does not issue such products or grant usage rights.",
        "ギフトカードなど別途条件が必要な商品を販売する場合、発行・利用・有効期間・残高返金などの条件を購入前に別途案内します。紹介画面や問い合わせ機能だけで商品が発行されたり利用権が付与されたりするものではありません。"
      ]
    ]
  },
  "terms-order-changes": {
    "title": [
      "Article 13 · Order changes and production",
      "第13条・注文変更と製作の進行"
    ],
    "clauses": [
      [
        "Users wishing to change or cancel an order must notify the Company of the order number and request. The Company checks processing and production status and promptly explains available changes. Checking order status or editing a design in My account does not itself submit a cancellation request.",
        "注文の変更やキャンセルを希望する利用者は、注文番号と依頼内容を会社に知らせる必要があります。会社は処理・製作状況と変更可否を確認し、遅滞なく案内します。マイページでの注文状況の確認やデザイン編集だけでは、キャンセルの申請にはなりません。"
      ],
      [
        "Before production, the Company enables users to confirm final specifications and individually agreed production and delivery conditions. Starting production alone does not impose a blanket restriction on statutory withdrawal rights.",
        "会社は製作前に、最終仕様と個別に合意した製作・配送条件を確認できるよう案内します。製作開始だけを理由に、法定の申込み撤回権を一律に制限しません。"
      ],
      [
        "If specification changes during production require extra costs or schedule changes, the Company explains the available changes and objective cost calculations in advance and obtains user consent. It does not make changes or charge costs without consent.",
        "製作中の仕様変更に追加費用や日程変更が必要な場合、会社は変更可能な範囲と客観的な費用算定根拠を事前に説明して同意を得ます。同意なく変更したり費用を請求したりしません。"
      ],
      [
        "Consultation under this article does not restrict withdrawal, refund or defect remedies under Articles 15–18. Production costs or change-consultation costs are not imposed as penalties where statutory withdrawal is available.",
        "本条の変更協議は、第15条から第18条までの申込み撤回・返金・不具合救済の権利を制限しません。法定の申込み撤回が認められる取引で、製作費や変更協議の費用を違約金として課しません。"
      ]
    ]
  },
  "terms-delivery": {
    "title": [
      "Article 14 · Production, delivery and installation",
      "第14条・製作、配送と設置"
    ],
    "clauses": [
      [
        "Before ordering, the Company explains product-specific production lead times, expected delivery timing and delivery and installation scope. Separately agreed supply timing, including for made-to-order products, is followed.",
        "会社は注文前に、商品ごとの製作期間、配送予定時期、配送・設置範囲を案内します。受注製作などにより別途供給時期を合意した場合は、その合意に従います。"
      ],
      [
        "Without a separate agreement on supply timing, the Company takes necessary supply measures within 7 days of the order, or within 3 business days of receiving full or partial advance payment. These are deadlines for necessary measures such as packing or production, not guaranteed completed delivery dates for all custom furniture. The Company provides progress information.",
        "供給時期の別途合意がなければ注文日から7日以内に、代金の全部または一部を前払いで受領した場合は受領日から3営業日以内に、供給に必要な措置を行います。これは梱包・製作など必要な措置の期限であり、すべてのカスタム家具の配送完了日を意味しません。会社は進行状況を確認できるよう案内します。"
      ],
      [
        "If supply is impossible, the Company promptly explains why. For prepaid transactions it refunds or takes necessary refund measures within 3 business days of receiving payment, as required by law. If agreed delivery is delayed, it explains the reasons and revised schedule and compensates for losses attributable to it under applicable law.",
        "供給できない場合は遅滞なく理由を知らせ、前払い取引では法定期限に従い、代金受領日から3営業日以内に返金または返金に必要な措置を行います。合意した配送が遅れる場合は理由と新たな日程を知らせ、会社の責めに帰すべき損害は法令に従い賠償します。"
      ],
      [
        "If site conditions require a furniture lift, extra personnel or redelivery, the parties confirm and discuss previously disclosed standards and actual costs. Costs arising from the Company’s fault are not charged to the user.",
        "配送先・現場条件によりリフト車、追加人員、再配送などが必要な場合は、事前に案内した基準と実際の費用を確認して協議します。会社の過失による費用を利用者に負担させません。"
      ],
      [
        "If damage, missing items or incorrect delivery are discovered on receipt, users should notify the Company with the order number and condition. Photos help prompt verification, but failure to inspect immediately or provide photos does not exclude statutory rights. Assembly, use, wall anchoring and other safety measures follow product-specific instructions.",
        "受領時に破損・不足・誤配送が判明した場合は、注文番号と状況を会社にお知らせください。写真は迅速な確認に役立ちますが、即時に検品しなかったことや写真がないことだけで法定の権利を排除しません。組立・使用、壁への固定などの安全対策は商品ごとの案内に従ってください。"
      ]
    ]
  },
  "terms-withdrawal": {
    "title": [
      "Article 15 · Statutory withdrawal",
      "第15条・申込み撤回"
    ],
    "clauses": [
      [
        "Users may withdraw within 7 days after receiving written or electronic contract details. If products arrive later, the period is 7 days after receiving the products or the start of supply. Separate statutory periods apply if contract documents were not provided, the address was omitted, withdrawal was obstructed or other statutory circumstances arise.",
        "利用者は、契約内容の書面または電子文書を受け取った日から7日以内に申込みを撤回できます。商品をそれより遅く受け取った場合は、商品の供給を受けた日または供給が開始した日から7日以内です。契約書面の未交付、住所の不記載、撤回の妨害などがある場合は、法律が定める別途の期間を適用します。"
      ],
      [
        "If products differ from their description, advertising or the contract, users may withdraw within 3 months after supply and within 30 days after discovering, or being able to discover, the discrepancy. This right also applies to made-to-order products.",
        "商品が表示・広告または契約内容と異なる場合、供給を受けた日から3か月以内、かつその事実を知った日または知り得た日から30日以内に申込みを撤回できます。この権利は受注製作商品にも適用されます。"
      ],
      [
        "Withdrawal may be restricted within statutory limits where legal grounds exist, such as loss or damage attributable to the user, substantial loss of value through use, or passage of time making resale difficult. Opening packaging only to check the contents is not such a restriction. Assembly alone does not justify a blanket refusal of returns.",
        "利用者に責任のある商品の滅失・損傷、使用による価値の著しい減少、時間の経過により再販売が困難なほどの価値の減少など、法定の制限事由がある場合は、法令が認める範囲で撤回が制限されることがあります。内容確認のための開封だけでは制限しません。組み立てたという事実だけで一律に返品を拒否することもありません。"
      ],
      [
        "The Company must take required measures, including clearly disclosing statutory restrictions in advance. Disputes about whether restrictions apply, responsibility for damage, or contract and supply dates follow the statutory burden of proof.",
        "会社は、法律が求める制限事由を消費者が容易に把握できるよう事前に表示するなど、必要な措置を取らなければなりません。制限要件の充足、商品の損傷の責任、契約・供給時期などに争いがある場合は、法定の立証責任に従います。"
      ],
      [
        "Withdrawal may be requested by email or another method capable of communicating the user’s intention. Providing the order number, product and request helps prompt processing. Written or electronic notices take effect when sent, as provided by law; return delivery need not also arrive within 7 days.",
        "申込み撤回は、会社へのメールなど意思を伝達できる方法で請求できます。注文番号、商品、依頼内容を添えると迅速な確認に役立ちます。書面や電子文書による請求は、法令に従い発送した日に効力が生じ、返品商品自体が7日以内に到着することは求めません。"
      ]
    ]
  },
  "terms-custom-withdrawal": {
    "title": [
      "Article 16 · Restrictions for made-to-order products",
      "第16条・受注製作商品の申込み撤回の制限"
    ],
    "clauses": [
      [
        "Withdrawal because of a change of mind may be restricted for made-to-order products only within statutory limits and only if all requirements are met: (a) the product is individually manufactured to the user’s order or is similar in nature; (b) allowing withdrawal is expected to cause serious, irreparable loss to the Company; and (c) the Company separately discloses that fact in advance for that transaction and obtains the user’s written or electronic consent.",
        "受注製作商品の自己都合による申込み撤回は、次の要件をすべて満たす場合に限り、法令が認める範囲で制限できます。①利用者の注文に従って個別に製作される商品またはこれに類する商品であること、②撤回を認めると会社に回復不能な重大な損害が予想されること、③会社がその取引について事前に個別に告知し、利用者の書面または電子文書による同意を得ること。"
      ],
      [
        "The Company specifically explains affected products and specifications, the grounds for restriction and relevant production stages. Labelling everything “custom furniture” or obtaining blanket acceptance of general terms is insufficient. Even with standardised options, each actual transaction is assessed against statutory requirements.",
        "会社は、制限を適用する商品と仕様、制限理由、関係する製作段階を具体的に説明します。すべての商品を「カスタム家具」と表示したり、一般規約への一括同意を得たりするだけでは撤回を制限しません。定型オプションを選択した場合でも、実際の取引が法定要件を満たすか個別に判断します。"
      ],
      [
        "Ordinary statutory withdrawal rules apply where these requirements are not met. Even where they are met, users retain statutory rights concerning defects, incorrect delivery, non-conforming specifications and the Company’s non-performance.",
        "上記の要件を満たさない取引には、通常の申込み撤回基準を適用します。要件を満たす場合でも、不具合・誤配送・仕様の不一致、会社の債務不履行などに関する利用者の法定の権利は維持されます。"
      ],
      [
        "Agreed cancellation of transactions where statutory withdrawal is restricted, or cancellation costs attributable to the user, follow applicable law and lawful individual agreements. The Company does not charge flat penalties exceeding actual losses and statutory limits or claim all production costs without justification.",
        "法定の撤回が制限される取引の合意解除や、利用者の責めに帰すべき解除費用は、関係法令と適法な個別合意に従って処理します。実損害や法定限度を超える一律の違約金、根拠のない製作費全額を請求しません。"
      ]
    ]
  },
  "terms-refunds": {
    "title": [
      "Article 17 · Return costs and refunds",
      "第17条・返品費用と返金"
    ],
    "clauses": [
      [
        "Following valid withdrawal, the user returns products already received, and the Company provides the return address, collection method and cost responsibilities. The validity of the withdrawal notice does not depend on the Company approving the return.",
        "適法に申込みを撤回した場合、利用者は受領済みの商品を返還し、会社は返品先住所・回収方法・費用負担を案内します。会社の返品承認がなければ撤回の意思表示が有効にならない、ということではありません。"
      ],
      [
        "For statutory withdrawal due to a change of mind, the user bears necessary return costs. The Company bears return costs for defects, incorrect delivery or performance differing from descriptions, advertising or the contract. Responsibilities for initial delivery fees and other costs are clearly explained before ordering, and the same costs are not charged twice.",
        "自己都合による法定の撤回では、返還に必要な費用は利用者が負担します。不具合、誤配送、表示・広告または契約と異なる履行による返還費用は会社が負担します。当初送料などの負担基準は注文前に明確に案内し、同じ費用を重複請求しません。"
      ],
      [
        "The Company does not demand cancellation fees, return penalties, packing or storage charges as penalties or compensation merely because statutory withdrawal is exercised.",
        "会社は、法定の申込み撤回を理由として、別途のキャンセル手数料、返品違約金、梱包費・保管費などの違約金や損害賠償を請求しません。"
      ],
      [
        "The Company refunds the product price received within 3 business days after receiving returned products. If products have not yet been supplied, it refunds within 3 business days after withdrawal. Statutory late interest is paid if the refund is delayed.",
        "会社は商品を返還された日から3営業日以内に、受領した商品代金を返金します。商品が未供給の場合は、撤回した日から3営業日以内に返金します。返金が遅れる場合は、関係法令の定める遅延利息を支払います。"
      ],
      [
        "For card or similar payments, the Company promptly requests suspension or cancellation of the charge from the payment provider and informs the user. If payment has already been received from the provider, necessary refund measures follow applicable law. Refunds are not replaced by store credit or other products without user consent.",
        "カードなどで決済した場合、会社は遅滞なく決済事業者に請求の停止または取消しを求め、その処理を通知します。決済事業者から代金を受領済みの場合は、法令に従い返金に必要な措置を行います。利用者の同意なく返金をポイントや他の商品に置き換えません。"
      ]
    ]
  },
  "terms-aftercare": {
    "title": [
      "Article 18 · Defects, exchanges and aftercare",
      "第18条・不具合、交換とアフターサービス"
    ],
    "clauses": [
      [
        "The Company explains product-specific warranty and aftercare conditions and application methods, and takes necessary measures such as repairs, exchanges, refunds or compensation under applicable law and the contract. Applicable consumer dispute resolution standards are also considered.",
        "会社は商品ごとの品質保証・アフターサービスの条件と申請方法を案内し、法令と契約に従って修理、交換、返金、損害賠償などの必要な措置を行います。適用可能な消費者紛争解決基準も考慮します。"
      ],
      [
        "Users may notify the Company of their order number and problem. The Company explains verification methods, proposed resolution and expected timing. For paid repairs, it explains reasons and costs first and obtains consent before proceeding.",
        "利用者は注文番号と問題の内容を会社に知らせることができ、会社は確認方法、対応方針、予定日程を案内します。有償修理では理由と費用を先に説明し、同意を得てから進めます。"
      ],
      [
        "Normal wear, user negligence or damage caused by use contrary to instructions may require paid service depending on the facts and applicable law. This does not create a blanket exemption for manufacturing defects or the Company’s fault.",
        "通常使用による摩耗、利用者の過失、案内に反する使用による損傷は、事実関係と法令に従い有償対応となる場合があります。これを理由に、製造上の不具合や会社の過失まで一律に免責しません。"
      ],
      [
        "Expiry of the withdrawal period does not itself extinguish independently recognised warranty, defect-liability or compensation rights.",
        "申込み撤回期間が経過したというだけで、別途認められる品質保証、瑕疵担保、損害賠償などの権利がすべて消滅するものではありません。"
      ]
    ]
  },
  "terms-privacy": {
    "title": [
      "Article 19 · Protection of personal information",
      "第19条・個人情報の保護"
    ],
    "clauses": [
      [
        "The Company processes only the minimum personal information needed for services and transactions on lawful grounds and manages it securely under applicable laws, including the Korean Personal Information Protection Act. A separate privacy policy explains purposes, data items, retention, third-party provision, outsourcing and how to exercise rights.",
        "会社は、サービスと取引に必要最小限の個人情報を適法な根拠に基づいて取り扱い、韓国の個人情報保護法などの関係法令に従って安全に管理します。具体的な目的、項目、保有期間、第三者提供・委託、権利の行使方法は、別途のプライバシーポリシーで案内します。"
      ],
      [
        "Where processing requires consent, the Company explains its purposes and details and obtains separate consent. Refusing optional information or advertising does not restrict services or purchases otherwise available.",
        "同意が必要な個人情報の取扱いでは、目的と内容を知らせて別途同意を得ます。任意情報の提供や広告受信に同意しないことを理由に、本来利用できるサービスや購入を制限しません。"
      ],
      [
        "Users may request access, correction, deletion, suspension of processing or withdrawal of consent under applicable law. The Company acts within statutory deadlines and procedures and explains grounds and reasons for restrictions, such as mandatory retention.",
        "利用者は法令に従い、個人情報の閲覧・訂正・削除・取扱い停止、同意の撤回を求められます。会社は法定期限と手続きに従って処理し、保存義務などにより制限する場合は根拠と理由を案内します。"
      ]
    ]
  },
  "terms-company-duties": {
    "title": [
      "Article 20 · Obligations of the Company",
      "第20条・会社の義務"
    ],
    "clauses": [
      [
        "The Company complies with laws and these terms and endeavours to provide stable services, accurate product and transaction information, and contractual performance. It takes appropriate measures to protect personal and payment information.",
        "会社は法令と規約を遵守し、安定したサービスの提供、正確な商品・取引情報の案内、契約履行に努めます。個人情報と決済情報を保護する適切な安全措置を講じます。"
      ],
      [
        "The Company reviews and promptly handles legitimate enquiries and complaints. If more time is needed, it explains reasons and expected timing. It bears statutory responsibility for losses caused by misleading descriptions, advertising or its own fault.",
        "会社は利用者の正当な問い合わせ・苦情を確認し、速やかに処理します。時間が必要な場合は理由と予定日程を知らせ、不当な表示・広告や会社の責めに帰すべき損害には法令に従って責任を負います。"
      ],
      [
        "Advertising communications comply with applicable consent, disclosure and opt-out requirements.",
        "広告情報を送信する場合は、関係法令に基づく同意・表示・受信拒否の手続きを遵守します。"
      ]
    ]
  },
  "terms-user-duties": {
    "title": [
      "Article 21 · Obligations of users",
      "第21条・利用者の義務"
    ],
    "clauses": [
      [
        "Users must provide accurate order and account information and must not misuse another person’s personal information, account or payment method. False orders, payment fraud, unauthorised system access, malware distribution and intentional service disruption are prohibited.",
        "利用者は注文・アカウント情報を正確に提供し、他人の個人情報・アカウント・決済手段を不正利用してはなりません。虚偽注文、決済の不正利用、システムへの侵入、悪意あるプログラムの配布、意図的なサービス妨害は禁止されます。"
      ],
      [
        "Users must not infringe the Company’s or third parties’ copyright, trademarks, personal information or other rights, or post unlawful content. Users should review assembly, installation and use instructions provided for proper and safe use.",
        "利用者は会社や第三者の著作権・商標権・個人情報などの権利を侵害したり、違法なコンテンツを投稿したりしてはなりません。正常かつ安全な使用のため、提供された組立・設置・使用案内を確認してください。"
      ],
      [
        "Responsibility for a user’s breach is determined under applicable law in light of the breach, fault and actual losses. A user’s duty of care does not shift responsibility that should be borne by the Company.",
        "利用者の義務違反に関する責任は、違反内容、帰責性、実損害を考慮して法令に従って判断します。利用者の注意義務を理由に、会社が負うべき責任まで転嫁しません。"
      ]
    ]
  },
  "terms-content": {
    "title": [
      "Article 22 · Designs, posts and intellectual property",
      "第22条・デザイン、投稿と知的財産権"
    ],
    "clauses": [
      [
        "Rights in the Store’s software, images, writing, trademarks and other content belong to the Company or legitimate rights holders. Users must not copy, sell or use such content beyond authorised service use without consent, or use it to infringe others’ rights.",
        "ショップのプログラム、画像、文章、商標などの権利は、会社または正当な権利者に帰属します。利用者は、許可されたサービス利用範囲を超えて、権利者の同意なく複製・販売したり、他人の権利を侵害する方法で利用したりしてはなりません。"
      ],
      [
        "Rights in user-created reviews, photos, designs and other content remain with their original owners. The Company may use them only within the scope and period needed to provide requested services, such as saving or sharing designs, custom production, support or requested publication. Advertising, promotion or other separate uses require appropriate additional permission or consent.",
        "利用者が作成したレビュー、写真、デザインなどの権利は、元の権利者に帰属します。会社は、デザインの保存・共有、受注製作、顧客サポート、利用者が依頼した掲載など、サービス提供に必要な範囲と期間に限り利用できます。広告・宣伝など別目的の利用には、必要な利用許諾や同意を別途得ます。"
      ],
      [
        "Users must submit content they own or are lawfully permitted to use. On receiving a report of infringement or unlawful content, the Company checks the facts and takes measures under law, explaining reasons and appeal procedures where necessary. Legitimate reviews are not deleted merely for being critical.",
        "利用者は、権利を有する、または適法な利用許諾を得たコンテンツを登録する必要があります。会社は権利侵害や違法投稿の通報を受けた場合、事実関係を確認して法令に基づく措置を行い、必要に応じて理由と異議申立て方法を案内します。批判的であるという理由だけで正当なレビューを削除しません。"
      ],
      [
        "Independent transactions on external websites are subject to their own conditions, which users should review. Providing external links does not exempt the Company from responsibility for products it sells directly or for its own fault.",
        "外部サイトで独立して行われる取引は、その取引条件を確認してください。外部リンクを提供しただけで、会社が直接販売した商品に関する責任や、会社の過失による責任が免除されるものではありません。"
      ]
    ]
  },
  "terms-liability": {
    "title": [
      "Article 23 · Compensation and scope of liability",
      "第23条・損害賠償と責任の範囲"
    ],
    "clauses": [
      [
        "If the Company or a user breaches law or contract and causes loss to the other party, compensation is determined under applicable law, including fault and causation.",
        "会社または利用者が法令や契約に違反して相手方に損害を与えた場合、帰責性や因果関係など関係法令に従って賠償責任を負います。"
      ],
      [
        "If natural disasters or other force majeure impede performance, liability follows applicable law. The Company promptly explains the situation and takes measures to reduce harm. Force majeure does not automatically entitle it to retain payment for undelivered products or exclude cancellation or refund rights.",
        "天災などの不可抗力で履行が難しい場合の責任は法令に従って判断し、会社は遅滞なく状況を知らせ、損害軽減の措置を行います。不可抗力だけを理由に未履行商品の代金を当然に保持したり、利用者の解除・返金の権利を排除したりしません。"
      ],
      [
        "These terms do not exclude or unfairly shift liabilities that cannot lawfully be limited, including intentional misconduct, gross negligence, product liability or personal information protection obligations.",
        "この規約は、会社の故意・重過失、製造物責任、個人情報保護義務など、法令上制限できない責任を排除したり、不当に利用者へ転嫁したりするものとは解釈しません。"
      ]
    ]
  },
  "terms-resolution": {
    "title": [
      "Article 24 · Disputes and governing law",
      "第24条・紛争解決と準拠法"
    ],
    "clauses": [
      [
        "Enquiries about these terms, orders, cancellations, returns or products may be sent to contact@befun.co.kr. Including the order number and request helps verification. The Company prioritises legitimate requests and, if prompt resolution is difficult, explains reasons and timing.",
        "規約、注文、キャンセル・返品、商品に関するお問い合わせはcontact@befun.co.krへお送りいただけます。注文番号と依頼内容を添えると確認に役立ちます。会社は正当な依頼を優先処理し、迅速な処理が難しい場合は理由と対応日程を案内します。"
      ],
      [
        "Consumer disputes unresolved between the parties may use statutory procedures, including the 1372 Consumer Counselling Centre, Korea Consumer Agency redress and consumer dispute mediation. Using these procedures does not restrict the right to bring legal proceedings.",
        "当事者間での解決が難しい消費者紛争は、1372消費者相談センターの相談、韓国消費者院の被害救済、消費者紛争調停など、法令に基づく手続きを利用できます。これらの利用は、裁判を求める権利を制限しません。"
      ],
      [
        "The laws of the Republic of Korea govern these terms and transactions between the Company and users. Consumer e-commerce litigation is subject to the exclusive jurisdiction of the district court for the consumer’s address when proceedings are brought, or residence if no address exists. If the address or residence is unclear, or the consumer lives abroad, applicable statutory jurisdiction rules govern.",
        "この規約および会社と利用者の取引には、大韓民国の法令を適用します。消費者との電子商取引訴訟は、提訴時の消費者の住所、住所がない場合は居所を管轄する地方裁判所の専属管轄とします。住所や居所が不明な場合、外国居住者の場合などは、関係法令の管轄規定に従います。"
      ]
    ]
  }
};

export function localizedTermsGroups(locale: Locale): readonly TermsGroup[] {
  if (locale === 'ko') return termsGroups;
  const index = locale === 'ja' ? 1 : 0;
  return termsGroups.map(group => ({
    ...group,
    title: translate(locale, group.title),
    description: translate(locale, group.description),
    articles: group.articles.map(article => {
      const translated = translatedArticles[article.id];
      return translated ? { ...article, title: translated.title[index], clauses: translated.clauses.map(clause => clause[index]) } : article;
    }),
  }));
}
