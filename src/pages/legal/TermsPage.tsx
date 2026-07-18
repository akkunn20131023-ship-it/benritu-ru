import { Link } from "react-router-dom";
import { LegalLayout, LegalSection } from "./LegalLayout";

export default function TermsPage() {
  return (
    <LegalLayout title="利用規約" updated="2026年7月18日">
      <p className="text-sm text-neutral-600 dark:text-neutral-300">
        この利用規約（以下「本規約」）は、Mytnela Flow（以下「本サービス」）の利用条件を定めるものです。本サービスを利用された時点で、本規約に同意いただいたものとみなします。
      </p>

      <LegalSection heading="1. サービス内容">
        <p>本サービスは、ToDo・メモ・カレンダー・家計簿などの便利ツール、AI機能、ルームコード等による共同作業・オンライン機能を、ブラウザ上で提供するものです。アカウント登録・ログインは不要です。</p>
      </LegalSection>

      <LegalSection heading="2. 料金">
        <p>本サービスは無料で提供します。ただし、通信料金は利用者の負担となります。将来、有料機能を追加する場合は事前に告知します。</p>
      </LegalSection>

      <LegalSection heading="3. 禁止事項">
        <p>利用者は、本サービスの利用にあたり、次の行為を行ってはなりません。</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>法令または公序良俗に違反する行為</li>
          <li>他者の権利・プライバシーを侵害する行為</li>
          <li>他の利用者や第三者に不利益・迷惑を与える行為（オンライン機能での嫌がらせ等を含む）</li>
          <li>本サービスの運営を妨害する行為、過度な負荷をかける行為</li>
          <li>不正アクセス、リバースエンジニアリング等の不正な行為</li>
        </ul>
      </LegalSection>

      <LegalSection heading="4. データの取り扱い">
        <p>本サービスのデータは、原則として利用者の端末（ブラウザ）内に保存されます。詳細は<Link to="/privacy" className="text-accent underline">プライバシーポリシー</Link>をご確認ください。端末の変更やデータ消去に備え、エクスポート機能でのバックアップを推奨します。</p>
      </LegalSection>

      <LegalSection heading="5. 免責事項">
        <p>本サービスは現状有姿で提供され、特定目的への適合性・完全性・可用性等について保証しません。本サービスの利用または利用不能により生じた損害について、運営者は法令で認められる範囲で責任を負いません。データのバックアップは利用者の責任で行ってください。</p>
      </LegalSection>

      <LegalSection heading="6. サービスの変更・中断・終了">
        <p>運営者は、事前の告知なく本サービスの内容を変更し、または提供を中断・終了することがあります。これにより利用者に生じた損害について責任を負いません。</p>
      </LegalSection>

      <LegalSection heading="7. 規約の変更">
        <p>運営者は、必要に応じて本規約を変更することがあります。変更後の規約は本ページに掲載した時点で効力を生じます。</p>
      </LegalSection>

      <LegalSection heading="8. お問い合わせ">
        <p>本規約に関するお問い合わせは、トップページのお問い合わせ欄よりお願いします。</p>
      </LegalSection>
    </LegalLayout>
  );
}
