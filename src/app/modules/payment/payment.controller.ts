import { Request, Response } from "express";
import { doctorAppointment_Model } from "../doctorAppointment/doctorAppointment.model";
import { soloNurseAppoinment_Model } from "../soloNurseAppoinment/soloNurseAppoinment.model";
import { Payment_Model } from "./payment.model";
import { PaymentService } from "./payment.service";
import { sendEmail } from "../../utils/sendEmail";
import { Patient_Model } from "../patient/patient.model";
import { Clinic_Model } from "../clinic/clinic.model";
import { sendEmailWithSES } from "../../utils/sendEmailWithSES";

// Start payment for clinic appointment
const startClinicPayment = async (req: Request, res: Response) => {
  try {
    const {
      clinicName,
      bussinessIdentificationNumber,
      cliniEmail,
      clinicAddress,

      patientName,
      patientEmail,
      patientPhone,
      patientDateOfBirth,
      dataVisibility,
      method,
      token,
    } = req.body;

    const visibleChecked = dataVisibility === "ხილული" ? "☑" : "☐";
    const hiddenChecked = dataVisibility === "დაფარული" ? "☑" : "☐";
    const fullyHiddenChecked =
      dataVisibility === "სრულიად დაფარული" ? "☑" : "☐";

    console.log("req.body", req.body);
    const appointment = await doctorAppointment_Model.findById(
      req.body.appointmentId,
    );
    if (!appointment)
      return res.status(404).json({ message: "Appointment not found" });

    if (appointment.serviceType !== "online") {
      return res.status(400).json({
        message: "In-clinic appointments do not require online payment",
      });
    }

    const payment = await Payment_Model.create({
      appointmentId: appointment._id,
      appointmentType: "CLINIC",
      patientId: appointment.patientId,
      receiverId: appointment.clinicId,
      receiverType: "CLINIC",
      amount: appointment.appoinmentFee,
    });

    const bogOrder = await PaymentService.createBoGOrder(
      payment,
      method,
      token,
    );
    payment.bogOrderId = bogOrder.id;
    await payment.save();

    //     await sendEmailWithSES({
    //       to: patientEmail,
    //       subject: `Form N IV-200-8/ა`,
    //       html: `
    //   <!DOCTYPE html>
    //   <html>
    //   <head>
    //     <meta charset="UTF-8" />
    //   </head>
    //   <body style="font-family: Arial, sans-serif; background:#f4f6f8; padding:20px;">
    //     <div style="background:#ffffff; padding:30px; max-width:800px; margin:auto; line-height:1.6; color:#000;">

    // <p><strong>Form N IV-200-8/ა</strong></p>

    // <p><strong>ფორმა N IV-200-8/ა</strong></p>

    // <p>
    // ინფორმირებული თანხმობა სამედიცინო მომსახურების გაწევაზე, პერსონალური
    // მონაცემების დამუშავებაზე და ჯანმრთელობის შესახებ ელექტრონული ჩანაწერების
    // სისტემაში ეპიზოდის სტატუსის ფორმირებაზე
    // </p>

    // <br/>

    // <p><strong>კლინიკა:</strong> ${clinicName}</p>
    // <p><strong>კლინიკის საიდენტიფიკაციო მონაცემები:</strong> ${bussinessIdentificationNumber}</p>
    // <p><strong>კლინიკის მისამართი:</strong> ${clinicAddress}</p>
    // <p><strong>კლინიკის საკონტაქტო ინფორმაცია:</strong> ${cliniEmail}</p>

    // <br/>

    // <p>მე, ქვემოთ ხელმომწერი პაციენტი:</p>

    // <p><strong>სახელი, გვარი:</strong> ${patientName}</p>
    // <p><strong>დაბადების თარიღი:</strong> ${patientDateOfBirth}</p>
    // <p><strong>ტელეფონის ნომერი:</strong> ${patientPhone}</p>
    // <p><strong>ელ. ფოსტა:</strong> ${patientEmail}</p>

    // <p>ვაცხადებ და ვადასტურებ შემდეგს:</p>

    // <h3>I. ინფორმირებული თანხმობა სამედიცინო მომსახურების გაწევაზე</h3>

    // <p>
    // დადასტურებული მაქვს, რომ მომეწოდა ამომწურავი და გასაგები ინფორმაცია ჩემთვის
    // განკუთვნილი სამედიცინო მომსახურების შესახებ, მათ შორის:
    // </p>

    // <ul>
    // <li>მომსახურების შინაარსი და მიზანი;</li>
    // <li>შესაძლო სარგებელი და მოსალოდნელი შედეგები;</li>
    // <li>შესაძლო რისკები და გართულებები;</li>
    // <li>ალტერნატიული სამედიცინო მეთოდები (არსებობის შემთხვევაში).</li>
    // </ul>

    // <p>
    // ასევე, ჩემთვის ცნობილია სამედიცინო მომსახურეობაზე უარის შემთხვევაში დამდგარი შედეგის შესახებ.
    // მაქვს შესაძლებლობა დავსვა შეკითხვები და მივიღო მათზე პასუხები.
    // ზემოაღნიშნულის გათვალისწინებით, ნებაყოფლობით ვაცხადებ თანხმობას ჩემთვის
    // სამედიცინო მომსახურების გაწევაზე კლინიკის მიერ.
    // </p>

    // <h3>II. თანხმობა პერსონალური მონაცემების დამუშავებაზე</h3>

    // <p>
    // ვაცხადებ თანხმობას, რომ ${clinicName}-მ/მა (ს/კ ${bussinessIdentificationNumber})
    // დაამუშავოს ჩემი პერსონალური მონაცემები, რაც მოიცავს შემდეგს:
    // </p>

    // <ul>
    // <li>სახელი</li>
    // <li>გვარი</li>
    // <li>სქესი</li>
    // <li>პირადი ნომერი</li>
    // <li>დაბადების თარიღი</li>
    // <li>საცხოვრებელი მისამართი</li>
    // <li>ელექტრონული ფოსტა</li>
    // <li>ტელეფონის ნომერი</li>
    // </ul>

    // <p>
    // საქართველოს კანონის „პერსონალურ მონაცემთა დაცვის შესახებ“ შესაბამისად, შემდეგი მიზნებისთვის:
    // </p>

    // <ul>
    // <li>სამედიცინო მომსახურების გაწევა;</li>
    // <li>სამედიცინო დოკუმენტაციის წარმოება;</li>
    // <li>ხარისხის კონტროლი და ანგარიშგება;</li>
    // <li>კანონით გათვალისწინებული ვალდებულებების შესრულება.</li>
    // </ul>

    // <p>
    // ინფორმირებული ვარ პერსონალურ მონაცემთა დაცვის შესახებ საქართველოს კანონით
    // მონიჭებული ჩემი უფლებების შესახებ.
    // </p>

    // <h3>III. თანხმობა ჯანმრთელობის შესახებ ელექტრონული ჩანაწერების სისტემაში ეპიზოდის სტატუსის ფორმირებაზე</h3>

    // <p>
    // ვადასტურებ, რომ გავეცანი ჩემი ჯანმრთელობის მდგომარეობის შესახებ ელექტრონული
    // ჩანაწერების წარმოების წესს და ვფლობ ინფორმაციას, რომ თავად მაქვს უფლება ავირჩიო
    // ჩანაწერის სისტემაში ჩემი ეპიზოდის სტატუსი.
    // </p>

    // <p>
    // ხილული ${visibleChecked} <br/>
    // დაფარული ${hiddenChecked} <br/>
    // სრულიად დაფარული ${fullyHiddenChecked}
    // </p>

    // <h3>IV. დამატებითი დებულებები</h3>

    // <ul>
    // <li>ინფორმაცია მივიღე სრულად და გასაგებად;</li>
    // <li>თანხმობას ვაცხადებ ნებაყოფლობით, ზეწოლის გარეშე;</li>
    // <li>ვიცი, რომ ნებისმიერ დროს მაქვს უფლება გავაუქმო თანხმობა მოქმედი კანონმდებლობის ფარგლებში;</li>
    // <li>ჩემთვის ცნობილია ჩემი უფლებები პერსონალურ მონაცემებთან დაკავშირებით.</li>
    // </ul>

    // <br/>

    // <p><strong>პაციენტის თანხმობის დადასტურება (Click-wrap):</strong></p>

    // <p>☑ ვადასტურებ, რომ წავიკითხე და ვეთანხმები წინამდებარე ფორმის ყველა დებულებას.</p>

    // <br/>

    // <p><strong>დადასტურების თარიღი და დრო:</strong> ${new Date().toLocaleString()}</p>
    // <p><strong>IP მისამართი:</strong> ${"ip address"}</p>
    // <p><strong>პლატფორმა:</strong> MedConnect</p>

    // <br/>

    // <p>
    // ეს ფორმა გენერირებულია ელექტრონულად და თანხმობა დაფიქსირებულია ელექტრონული
    // საშუალებით, რაც კანონმდებლობის შესაბამისად უტოლდება ხელმოწერას.
    // </p>

    //     </div>
    //   </body>
    //   </html>
    //   `,
    //     });

    await sendEmail({
      to: patientEmail,
      subject: `Form N IV-200-8/ა`,
      html: `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="UTF-8" />
  </head>
  <body style="font-family: Arial, sans-serif; background:#f4f6f8; padding:20px;">
    <div style="background:#ffffff; padding:30px; max-width:800px; margin:auto; line-height:1.6; color:#000;">

<p><strong>Form N IV-200-8/ა</strong></p>

<p><strong>ფორმა N IV-200-8/ა</strong></p>

<p>
ინფორმირებული თანხმობა სამედიცინო მომსახურების გაწევაზე, პერსონალური 
მონაცემების დამუშავებაზე და ჯანმრთელობის შესახებ ელექტრონული ჩანაწერების 
სისტემაში ეპიზოდის სტატუსის ფორმირებაზე
</p>

<br/>

<p><strong>კლინიკა:</strong> ${clinicName}</p>
<p><strong>კლინიკის საიდენტიფიკაციო მონაცემები:</strong> ${bussinessIdentificationNumber}</p>
<p><strong>კლინიკის მისამართი:</strong> ${clinicAddress}</p>
<p><strong>კლინიკის საკონტაქტო ინფორმაცია:</strong> ${cliniEmail}</p>

<br/>

<p>მე, ქვემოთ ხელმომწერი პაციენტი:</p>

<p><strong>სახელი, გვარი:</strong> ${patientName}</p>
<p><strong>დაბადების თარიღი:</strong> ${patientDateOfBirth}</p>
<p><strong>ტელეფონის ნომერი:</strong> ${patientPhone}</p>
<p><strong>ელ. ფოსტა:</strong> ${patientEmail}</p>

<p>ვაცხადებ და ვადასტურებ შემდეგს:</p>

<h3>I. ინფორმირებული თანხმობა სამედიცინო მომსახურების გაწევაზე</h3>

<p>
დადასტურებული მაქვს, რომ მომეწოდა ამომწურავი და გასაგები ინფორმაცია ჩემთვის 
განკუთვნილი სამედიცინო მომსახურების შესახებ, მათ შორის:
</p>

<ul>
<li>მომსახურების შინაარსი და მიზანი;</li>
<li>შესაძლო სარგებელი და მოსალოდნელი შედეგები;</li>
<li>შესაძლო რისკები და გართულებები;</li>
<li>ალტერნატიული სამედიცინო მეთოდები (არსებობის შემთხვევაში).</li>
</ul>

<p>
ასევე, ჩემთვის ცნობილია სამედიცინო მომსახურეობაზე უარის შემთხვევაში დამდგარი შედეგის შესახებ.
მაქვს შესაძლებლობა დავსვა შეკითხვები და მივიღო მათზე პასუხები.
ზემოაღნიშნულის გათვალისწინებით, ნებაყოფლობით ვაცხადებ თანხმობას ჩემთვის
სამედიცინო მომსახურების გაწევაზე კლინიკის მიერ.
</p>

<h3>II. თანხმობა პერსონალური მონაცემების დამუშავებაზე</h3>

<p>
ვაცხადებ თანხმობას, რომ ${clinicName}-მ/მა (ს/კ ${bussinessIdentificationNumber})
დაამუშავოს ჩემი პერსონალური მონაცემები, რაც მოიცავს შემდეგს:
</p>

<ul>
<li>სახელი</li>
<li>გვარი</li>
<li>სქესი</li>
<li>პირადი ნომერი</li>
<li>დაბადების თარიღი</li>
<li>საცხოვრებელი მისამართი</li>
<li>ელექტრონული ფოსტა</li>
<li>ტელეფონის ნომერი</li>
</ul>

<p>
საქართველოს კანონის „პერსონალურ მონაცემთა დაცვის შესახებ“ შესაბამისად, შემდეგი მიზნებისთვის:
</p>

<ul>
<li>სამედიცინო მომსახურების გაწევა;</li>
<li>სამედიცინო დოკუმენტაციის წარმოება;</li>
<li>ხარისხის კონტროლი და ანგარიშგება;</li>
<li>კანონით გათვალისწინებული ვალდებულებების შესრულება.</li>
</ul>

<p>
ინფორმირებული ვარ პერსონალურ მონაცემთა დაცვის შესახებ საქართველოს კანონით
მონიჭებული ჩემი უფლებების შესახებ.
</p>

<h3>III. თანხმობა ჯანმრთელობის შესახებ ელექტრონული ჩანაწერების სისტემაში ეპიზოდის სტატუსის ფორმირებაზე</h3>

<p>
ვადასტურებ, რომ გავეცანი ჩემი ჯანმრთელობის მდგომარეობის შესახებ ელექტრონული
ჩანაწერების წარმოების წესს და ვფლობ ინფორმაციას, რომ თავად მაქვს უფლება ავირჩიო
ჩანაწერის სისტემაში ჩემი ეპიზოდის სტატუსი.
</p>

<p>
ხილული ${visibleChecked} <br/>
დაფარული ${hiddenChecked} <br/>
სრულიად დაფარული ${fullyHiddenChecked}
</p>


<h3>IV. დამატებითი დებულებები</h3>

<ul>
<li>ინფორმაცია მივიღე სრულად და გასაგებად;</li>
<li>თანხმობას ვაცხადებ ნებაყოფლობით, ზეწოლის გარეშე;</li>
<li>ვიცი, რომ ნებისმიერ დროს მაქვს უფლება გავაუქმო თანხმობა მოქმედი კანონმდებლობის ფარგლებში;</li>
<li>ჩემთვის ცნობილია ჩემი უფლებები პერსონალურ მონაცემებთან დაკავშირებით.</li>
</ul>

<br/>

<p><strong>პაციენტის თანხმობის დადასტურება (Click-wrap):</strong></p>

<p>☑ ვადასტურებ, რომ წავიკითხე და ვეთანხმები წინამდებარე ფორმის ყველა დებულებას.</p>

<br/>

<p><strong>დადასტურების თარიღი და დრო:</strong> ${new Date().toLocaleString()}</p>
<p><strong>IP მისამართი:</strong> ${"ip address"}</p>
<p><strong>პლატფორმა:</strong> MedConnect</p>

<br/>

<p>
ეს ფორმა გენერირებულია ელექტრონულად და თანხმობა დაფიქსირებულია ელექტრონული
საშუალებით, რაც კანონმდებლობის შესაბამისად უტოლდება ხელმოწერას.
</p>

    </div>
  </body>
  </html>
  `,
    });

    //     await sendEmailWithSES({
    //       to: cliniEmail,
    //       subject: `Form N IV-200-8/ა`,
    //       html: `
    //   <!DOCTYPE html>
    //   <html>
    //   <head>
    //     <meta charset="UTF-8" />
    //   </head>
    //   <body style="font-family: Arial, sans-serif; background:#f4f6f8; padding:20px;">
    //     <div style="background:#ffffff; padding:30px; max-width:800px; margin:auto; line-height:1.6; color:#000;">

    // <p><strong>Form N IV-200-8/ა</strong></p>

    // <p><strong>ფორმა N IV-200-8/ა</strong></p>

    // <p>
    // ინფორმირებული თანხმობა სამედიცინო მომსახურების გაწევაზე, პერსონალური
    // მონაცემების დამუშავებაზე და ჯანმრთელობის შესახებ ელექტრონული ჩანაწერების
    // სისტემაში ეპიზოდის სტატუსის ფორმირებაზე
    // </p>

    // <br/>

    // <p><strong>კლინიკა:</strong> ${clinicName}</p>
    // <p><strong>კლინიკის საიდენტიფიკაციო მონაცემები:</strong> ${bussinessIdentificationNumber}</p>
    // <p><strong>კლინიკის მისამართი:</strong> ${clinicAddress}</p>
    // <p><strong>კლინიკის საკონტაქტო ინფორმაცია:</strong> ${cliniEmail}</p>

    // <br/>

    // <p>მე, ქვემოთ ხელმომწერი პაციენტი:</p>

    // <p><strong>სახელი, გვარი:</strong> ${patientName}</p>
    // <p><strong>დაბადების თარიღი:</strong> ${patientDateOfBirth}</p>
    // <p><strong>ტელეფონის ნომერი:</strong> ${patientPhone}</p>
    // <p><strong>ელ. ფოსტა:</strong> ${patientEmail}</p>

    // <p>ვაცხადებ და ვადასტურებ შემდეგს:</p>

    // <h3>I. ინფორმირებული თანხმობა სამედიცინო მომსახურების გაწევაზე</h3>

    // <p>
    // დადასტურებული მაქვს, რომ მომეწოდა ამომწურავი და გასაგები ინფორმაცია ჩემთვის
    // განკუთვნილი სამედიცინო მომსახურების შესახებ, მათ შორის:
    // </p>

    // <ul>
    // <li>მომსახურების შინაარსი და მიზანი;</li>
    // <li>შესაძლო სარგებელი და მოსალოდნელი შედეგები;</li>
    // <li>შესაძლო რისკები და გართულებები;</li>
    // <li>ალტერნატიული სამედიცინო მეთოდები (არსებობის შემთხვევაში).</li>
    // </ul>

    // <p>
    // ასევე, ჩემთვის ცნობილია სამედიცინო მომსახურეობაზე უარის შემთხვევაში დამდგარი შედეგის შესახებ.
    // მაქვს შესაძლებლობა დავსვა შეკითხვები და მივიღო მათზე პასუხები.
    // ზემოაღნიშნულის გათვალისწინებით, ნებაყოფლობით ვაცხადებ თანხმობას ჩემთვის
    // სამედიცინო მომსახურების გაწევაზე კლინიკის მიერ.
    // </p>

    // <h3>II. თანხმობა პერსონალური მონაცემების დამუშავებაზე</h3>

    // <p>
    // ვაცხადებ თანხმობას, რომ ${clinicName}-მ/მა (ს/კ ${bussinessIdentificationNumber})
    // დაამუშავოს ჩემი პერსონალური მონაცემები, რაც მოიცავს შემდეგს:
    // </p>

    // <ul>
    // <li>სახელი</li>
    // <li>გვარი</li>
    // <li>სქესი</li>
    // <li>პირადი ნომერი</li>
    // <li>დაბადების თარიღი</li>
    // <li>საცხოვრებელი მისამართი</li>
    // <li>ელექტრონული ფოსტა</li>
    // <li>ტელეფონის ნომერი</li>
    // </ul>

    // <p>
    // საქართველოს კანონის „პერსონალურ მონაცემთა დაცვის შესახებ“ შესაბამისად, შემდეგი მიზნებისთვის:
    // </p>

    // <ul>
    // <li>სამედიცინო მომსახურების გაწევა;</li>
    // <li>სამედიცინო დოკუმენტაციის წარმოება;</li>
    // <li>ხარისხის კონტროლი და ანგარიშგება;</li>
    // <li>კანონით გათვალისწინებული ვალდებულებების შესრულება.</li>
    // </ul>

    // <p>
    // ინფორმირებული ვარ პერსონალურ მონაცემთა დაცვის შესახებ საქართველოს კანონით
    // მონიჭებული ჩემი უფლებების შესახებ.
    // </p>

    // <h3>III. თანხმობა ჯანმრთელობის შესახებ ელექტრონული ჩანაწერების სისტემაში ეპიზოდის სტატუსის ფორმირებაზე</h3>

    // <p>
    // ვადასტურებ, რომ გავეცანი ჩემი ჯანმრთელობის მდგომარეობის შესახებ ელექტრონული
    // ჩანაწერების წარმოების წესს და ვფლობ ინფორმაციას, რომ თავად მაქვს უფლება ავირჩიო
    // ჩანაწერის სისტემაში ჩემი ეპიზოდის სტატუსი.
    // </p>

    // <p>
    // ხილული ${visibleChecked} <br/>
    // დაფარული ${hiddenChecked} <br/>
    // სრულიად დაფარული ${fullyHiddenChecked}
    // </p>

    // <h3>IV. დამატებითი დებულებები</h3>

    // <ul>
    // <li>ინფორმაცია მივიღე სრულად და გასაგებად;</li>
    // <li>თანხმობას ვაცხადებ ნებაყოფლობით, ზეწოლის გარეშე;</li>
    // <li>ვიცი, რომ ნებისმიერ დროს მაქვს უფლება გავაუქმო თანხმობა მოქმედი კანონმდებლობის ფარგლებში;</li>
    // <li>ჩემთვის ცნობილია ჩემი უფლებები პერსონალურ მონაცემებთან დაკავშირებით.</li>
    // </ul>

    // <br/>

    // <p><strong>პაციენტის თანხმობის დადასტურება (Click-wrap):</strong></p>

    // <p>☑ ვადასტურებ, რომ წავიკითხე და ვეთანხმები წინამდებარე ფორმის ყველა დებულებას.</p>

    // <br/>

    // <p><strong>დადასტურების თარიღი და დრო:</strong> ${new Date().toLocaleString()}</p>
    // <p><strong>IP მისამართი:</strong> ${"ip address"}</p>
    // <p><strong>პლატფორმა:</strong> MedConnect</p>

    // <br/>

    // <p>
    // ეს ფორმა გენერირებულია ელექტრონულად და თანხმობა დაფიქსირებულია ელექტრონული
    // საშუალებით, რაც კანონმდებლობის შესაბამისად უტოლდება ხელმოწერას.
    // </p>

    //     </div>
    //   </body>
    //   </html>
    //   `,
    //     });

    await sendEmail({
      to: cliniEmail,
      subject: `Form N IV-200-8/ა`,
      html: `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="UTF-8" />
  </head>
  <body style="font-family: Arial, sans-serif; background:#f4f6f8; padding:20px;">
    <div style="background:#ffffff; padding:30px; max-width:800px; margin:auto; line-height:1.6; color:#000;">

<p><strong>Form N IV-200-8/ა</strong></p>

<p><strong>ფორმა N IV-200-8/ა</strong></p>

<p>
ინფორმირებული თანხმობა სამედიცინო მომსახურების გაწევაზე, პერსონალური 
მონაცემების დამუშავებაზე და ჯანმრთელობის შესახებ ელექტრონული ჩანაწერების 
სისტემაში ეპიზოდის სტატუსის ფორმირებაზე
</p>

<br/>

<p><strong>კლინიკა:</strong> ${clinicName}</p>
<p><strong>კლინიკის საიდენტიფიკაციო მონაცემები:</strong> ${bussinessIdentificationNumber}</p>
<p><strong>კლინიკის მისამართი:</strong> ${clinicAddress}</p>
<p><strong>კლინიკის საკონტაქტო ინფორმაცია:</strong> ${cliniEmail}</p>

<br/>

<p>მე, ქვემოთ ხელმომწერი პაციენტი:</p>

<p><strong>სახელი, გვარი:</strong> ${patientName}</p>
<p><strong>დაბადების თარიღი:</strong> ${patientDateOfBirth}</p>
<p><strong>ტელეფონის ნომერი:</strong> ${patientPhone}</p>
<p><strong>ელ. ფოსტა:</strong> ${patientEmail}</p>

<p>ვაცხადებ და ვადასტურებ შემდეგს:</p>

<h3>I. ინფორმირებული თანხმობა სამედიცინო მომსახურების გაწევაზე</h3>

<p>
დადასტურებული მაქვს, რომ მომეწოდა ამომწურავი და გასაგები ინფორმაცია ჩემთვის 
განკუთვნილი სამედიცინო მომსახურების შესახებ, მათ შორის:
</p>

<ul>
<li>მომსახურების შინაარსი და მიზანი;</li>
<li>შესაძლო სარგებელი და მოსალოდნელი შედეგები;</li>
<li>შესაძლო რისკები და გართულებები;</li>
<li>ალტერნატიული სამედიცინო მეთოდები (არსებობის შემთხვევაში).</li>
</ul>

<p>
ასევე, ჩემთვის ცნობილია სამედიცინო მომსახურეობაზე უარის შემთხვევაში დამდგარი შედეგის შესახებ.
მაქვს შესაძლებლობა დავსვა შეკითხვები და მივიღო მათზე პასუხები.
ზემოაღნიშნულის გათვალისწინებით, ნებაყოფლობით ვაცხადებ თანხმობას ჩემთვის
სამედიცინო მომსახურების გაწევაზე კლინიკის მიერ.
</p>

<h3>II. თანხმობა პერსონალური მონაცემების დამუშავებაზე</h3>

<p>
ვაცხადებ თანხმობას, რომ ${clinicName}-მ/მა (ს/კ ${bussinessIdentificationNumber})
დაამუშავოს ჩემი პერსონალური მონაცემები, რაც მოიცავს შემდეგს:
</p>

<ul>
<li>სახელი</li>
<li>გვარი</li>
<li>სქესი</li>
<li>პირადი ნომერი</li>
<li>დაბადების თარიღი</li>
<li>საცხოვრებელი მისამართი</li>
<li>ელექტრონული ფოსტა</li>
<li>ტელეფონის ნომერი</li>
</ul>

<p>
საქართველოს კანონის „პერსონალურ მონაცემთა დაცვის შესახებ“ შესაბამისად, შემდეგი მიზნებისთვის:
</p>

<ul>
<li>სამედიცინო მომსახურების გაწევა;</li>
<li>სამედიცინო დოკუმენტაციის წარმოება;</li>
<li>ხარისხის კონტროლი და ანგარიშგება;</li>
<li>კანონით გათვალისწინებული ვალდებულებების შესრულება.</li>
</ul>

<p>
ინფორმირებული ვარ პერსონალურ მონაცემთა დაცვის შესახებ საქართველოს კანონით
მონიჭებული ჩემი უფლებების შესახებ.
</p>

<h3>III. თანხმობა ჯანმრთელობის შესახებ ელექტრონული ჩანაწერების სისტემაში ეპიზოდის სტატუსის ფორმირებაზე</h3>

<p>
ვადასტურებ, რომ გავეცანი ჩემი ჯანმრთელობის მდგომარეობის შესახებ ელექტრონული
ჩანაწერების წარმოების წესს და ვფლობ ინფორმაციას, რომ თავად მაქვს უფლება ავირჩიო
ჩანაწერის სისტემაში ჩემი ეპიზოდის სტატუსი.
</p>

<p>
ხილული ${visibleChecked} <br/>
დაფარული ${hiddenChecked} <br/>
სრულიად დაფარული ${fullyHiddenChecked}
</p>


<h3>IV. დამატებითი დებულებები</h3>

<ul>
<li>ინფორმაცია მივიღე სრულად და გასაგებად;</li>
<li>თანხმობას ვაცხადებ ნებაყოფლობით, ზეწოლის გარეშე;</li>
<li>ვიცი, რომ ნებისმიერ დროს მაქვს უფლება გავაუქმო თანხმობა მოქმედი კანონმდებლობის ფარგლებში;</li>
<li>ჩემთვის ცნობილია ჩემი უფლებები პერსონალურ მონაცემებთან დაკავშირებით.</li>
</ul>

<br/>

<p><strong>პაციენტის თანხმობის დადასტურება (Click-wrap):</strong></p>

<p>☑ ვადასტურებ, რომ წავიკითხე და ვეთანხმები წინამდებარე ფორმის ყველა დებულებას.</p>

<br/>

<p><strong>დადასტურების თარიღი და დრო:</strong> ${new Date().toLocaleString()}</p>
<p><strong>IP მისამართი:</strong> ${"ip address"}</p>
<p><strong>პლატფორმა:</strong> MedConnect</p>

<br/>

<p>
ეს ფორმა გენერირებულია ელექტრონულად და თანხმობა დაფიქსირებულია ელექტრონული
საშუალებით, რაც კანონმდებლობის შესაბამისად უტოლდება ხელმოწერას.
</p>

    </div>
  </body>
  </html>
  `,
    });
    // res.json({ redirectUrl: bogOrder._links.redirect.href });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Start payment for solo nurse appointment
const startSoloNursePayment = async (req: Request, res: Response) => {
  try {
    const appointment = await soloNurseAppoinment_Model.findById(
      req.body.appointmentId,
    );
    if (!appointment)
      return res.status(404).json({ message: "Appointment not found" });

    const payment = await Payment_Model.create({
      appointmentId: appointment._id,
      appointmentType: "SOLO_NURSE",
      patientId: appointment.patientId,
      receiverId: appointment.soloNurseId,
      receiverType: "SOLO_NURSE",
      amount: appointment.appointmentFee,
    });

    const bogOrder = await PaymentService.createBoGOrder(
      payment,
      req.body.method,
      req.body.token,
    );
    payment.bogOrderId = bogOrder.id;
    await payment.save();

    res.json({ redirectUrl: bogOrder._links.redirect.href });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// BoG webhook callback
const bogCallbackController = async (req: Request, res: Response) => {
  try {
    await PaymentService.handleBoGCallbackService(req.body);
    res.json({ success: true, message: "Callback processed" });
  } catch (error: any) {
    console.error("BoG Callback Error:", error.message);
    res.sendStatus(200); // Always return 200 to prevent webhook retries
  }
};

// Payment success page
const paymentSuccess = async (req: Request, res: Response) => {
  const { paymentId } = req.query;
  if (!paymentId) return res.status(400).send("Invalid payment request");

  const payment = await Payment_Model.findById(paymentId as string);
  if (!payment) return res.status(404).send("Payment not found");

  res.send(`
    <h2>✅ Payment Successful</h2>
    <p>Your payment is being processed.</p>
    <p>Reference ID: ${paymentId}</p>
  `);
};

// Payment failed page
const paymentFail = async (req: Request, res: Response) => {
  const { paymentId } = req.query;
  if (!paymentId) return res.status(400).send("Invalid payment request");

  const payment = await Payment_Model.findById(paymentId as string);
  if (!payment) return res.status(404).send("Payment not found");

  res.send(`
    <h2>❌ Payment Failed</h2>
    <p>Your payment was not completed.</p>
    <p>Reference ID: ${paymentId}</p>
  `);
};

const getPaymentIdForRefund = async (req: Request, res: Response) => {
  try {
    const { appointmentId, appointmentType } = req.query;

    if (!appointmentId || !appointmentType) {
      return res.status(400).json({
        success: false,
        message: "appointmentId and appointmentType are required",
      });
    }

    const paymentId = await PaymentService.getPaymentIdForRefund(
      appointmentId as string,
      appointmentType as "CLINIC" | "SOLO_NURSE",
    );

    return res.status(200).json({
      success: true,
      message: "Payment ID fetched successfully",
      data: { paymentId },
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Admin payment overview
const adminPaymentData = async (_req: Request, res: Response) => {
  try {
    const data = await PaymentService.adminPaymentData();
    res.json({
      success: true,
      message: "Payment data fetched successfully",
      data,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Admin get all transactions
const getAllTransactions = async (_req: Request, res: Response) => {
  try {
    const data = await PaymentService.getAllTransactions();
    res.json({
      success: true,
      message: "All transaction data fetched successfully",
      data,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const PaymentController = {
  startClinicPayment,
  startSoloNursePayment,
  bogCallbackController,
  paymentSuccess,
  paymentFail,
  adminPaymentData,
  getAllTransactions,
  getPaymentIdForRefund,
};
