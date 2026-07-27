import { Request, Response } from "express";
import { doctorAppointment_Model } from "../doctorAppointment/doctorAppointment.model";
import { soloNurseAppoinment_Model } from "../soloNurseAppoinment/soloNurseAppoinment.model";
import { Payment_Model } from "./payment.model";
import { PaymentService } from "./payment.service";
import { sendEmail } from "../../utils/sendEmail";
import { Patient_Model } from "../patient/patient.model";
import { Clinic_Model } from "../clinic/clinic.model";
import { sendEmailWithSES } from "../../utils/sendEmailWithSES";
import { sendBoGPaymentResponse } from "../../utils/sendBoGPaymentResponse";

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
    )
      .populate({
        path: "patientId",
        populate: {
          path: "userId",
          model: "user",
          select: "email fullName",
        },
      })
      .populate({
        path: "soloNurseId",
        populate: {
          path: "userId",
          model: "user",
          select: "email fullName",
        },
      });

    // const patientEmail = (appointment?.patientId as any)?.userId?.email;
    // const soloNurseEmail = (appointment?.soloNurseId as any)?.userId?.email;


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


  //   const roundMoney = (value: number) =>
  //     Math.round((value + Number.EPSILON) * 100) / 100;

  //   const commissionAmount = roundMoney((appointment.appointmentFee - appointment.appointmentFee * 0.05) * 0.15);
  //   const nurseAmount = roundMoney((appointment.appointmentFee - appointment.appointmentFee * 0.05) * 0.85);

  //   // giorgi's email 
  //   const accountingEmail = "accounting@medconnect.com.ge";

  //   const nurseReceiptHtml = `
  // <div style="font-family: Arial, sans-serif; max-width: 750px; margin: auto; padding: 25px; border: 1px solid #e5e7eb; border-radius: 10px; color: #111827;">

  //   <h1 style="color: #0f766e; margin-bottom: 5px;">
  //     MedConnect
  //   </h1>

  //   <p style="margin: 3px 0;">
  //     <strong>კომპანიის დასახელება:</strong>
  //     შპს მედქონექთ ჯგუფი 2025
  //   </p>

  //   <p style="margin: 3px 0;">
  //     <strong>საიდენტიფიკაციო კოდი:</strong>
  //     430049501
  //   </p>

  //   <p style="margin: 3px 0;">
  //     <strong>მისამართი:</strong>
  //     საქართველო, ზესტაფონის რაიონი, ს. შუა კვალითი, მე–19 I შეს., N 4
  //   </p>

  //   <hr style="margin: 25px 0;" />

  //   <h2 style="margin-bottom: 15px;">
  //     საკომისიო ინვოისი
  //   </h2>

  //   <p>
  //     <strong>ინვოისის ნომერი:</strong>
  //     COMM-${payment._id}
  //   </p>

  //   <p>
  //     <strong>გაცემის თარიღი:</strong>
  //     ${new Date().toLocaleDateString()}
  //   </p>

  //   <p>
  //     <strong>შეკვეთის ID:</strong>
  //     ${payment._id}
  //   </p>

  //   <hr style="margin: 25px 0;" />

  //   <h3>მიმღები</h3>

  //   <p>
  //     <strong>სახელი და გვარი:</strong>
  //     ${(appointment.soloNurseId as any)?.userId?.fullName || "N/A"}
  //   </p>

  //   <p>
  //     <strong>სტატუსი:</strong>
  //     ინდმეწარმე / მცირე მეწარმე
  //   </p>

  //   <p>
  //     <strong>საიდენტიფიკაციო ნომერი:</strong>
  //     ${(appointment.soloNurseId as any)?.nationalIdNumber || "N/A"}
  //   </p>

  //   <hr style="margin: 25px 0;" />

  //   <h3>მომსახურების აღწერა</h3>

  //   <p>
  //     MedConnect პლატფორმის საკომისიო მომსახურება
  //   </p>

  //   <hr style="margin: 25px 0;" />

  //   <h3>ფინანსური ინფორმაცია</h3>

  //   <p>
  //     <strong>მომსახურების სრული ღირებულება:</strong>
  //     ${roundMoney(appointment.appointmentFee - appointment.appointmentFee * 0.05)} ₾
  //   </p>

  //   <p>
  //     <strong>საკომისიო (15%):</strong>
  //     ${commissionAmount} ₾
  //   </p>
  //   <p>
  //     <strong>მათ შორის დღგ (18%):</strong>
  //     ${roundMoney(commissionAmount * 0.18)} ₾
  //   </p>

    

  //   <p style="font-size: 18px;">
  //     <strong>სულ:</strong>
  //     ${commissionAmount} ₾
  //   </p>

  //   <hr style="margin: 25px 0;" />

  //   <h3>ექთანზე ჩასარიცხი თანხა</h3>

  //   <p style="font-size: 18px;">
  //     <strong>${nurseAmount} ₾</strong>
  //   </p>

  //   <hr style="margin: 25px 0;" />

  //   <h3>გადახდის თარიღი</h3>

  //   <p>
  //     ${new Date().toLocaleDateString()}
  //   </p>

  //   <hr style="margin: 25px 0;" />

  //   <h3>შენიშვნა</h3>

  //   <p style="line-height: 1.7;">
  //     აღნიშნული ინვოისი ასახავს MedConnect-ის საკომისიოს მოცემულ შეკვეთაზე.
  //   </p>

  //   <hr style="margin: 25px 0;" />

  //   <h3>საკონტაქტო</h3>

  //   <p>
  //     main@medconnect.com.ge
  //   </p>

  // </div>
  // `;
  //   const patientReceit1 = `
  // <div style="font-family: Arial, sans-serif; max-width: 750px; margin: auto; padding: 25px; border: 1px solid #e5e7eb; border-radius: 10px; color: #111827;">

  //   <h1 style="color: #0f766e; margin-bottom: 5px;">
  //     MedConnect
  //   </h1>

  //   <p style="margin: 3px 0;">
  //     <strong>კომპანიის დასახელება:</strong>
  //     შპს მედქონექთ ჯგუფი 2025
  //   </p>

  //   <p style="margin: 3px 0;">
  //     <strong>საიდენტიფიკაციო კოდი:</strong>
  //     430049501
  //   </p>

  //   <p style="margin: 3px 0;">
  //     <strong>მისამართი:</strong>
  //     საქართველო, ზესტაფონის რაიონი, ს. შუა კვალითი, მე–19 I შეს., N 4
  //   </p>

  //   <hr style="margin: 25px 0;" />

  //   <h2 style="margin-bottom: 15px;">
  //     მომსახურების ქვითარი
  //   </h2>

  //   <p>
  //     <strong>დოკუმენტის ნომერი:</strong>
  //     NUR-${payment._id}
  //   </p>

  //   <p>
  //     <strong>გაცემის თარიღი:</strong>
  //     ${new Date().toLocaleDateString()}
  //   </p>

  //   <p>
  //     <strong>შეკვეთის ID:</strong>
  //     ${payment._id}
  //   </p>

  //   <hr style="margin: 25px 0;" />

  //   <h3>მომსახურების გამწევი</h3>

  //   <p>
  //     <strong>სახელი და გვარი:</strong>
  //     ${(appointment.soloNurseId as any)?.userId?.fullName || "N/A"}
  //   </p>

  //   <p>
  //     <strong>სტატუსი:</strong>
  //     ინდმეწარმე / მცირე მეწარმე
  //   </p>

  //   <p>
  //     <strong>საიდენტიფიკაციო ნომერი:</strong>
  //     ${(appointment.soloNurseId as any)?.nationalIdNumber || "N/A"}
  //   </p>

  //   <hr style="margin: 25px 0;" />

  //   <h3>პაციენტი</h3>

  //   <p>
  //     <strong>სახელი და გვარი:</strong>
  //     ${(appointment.patientId as any)?.userId?.fullName || "N/A"}
  //   </p>

  //   <hr style="margin: 25px 0;" />

  //   <h3>მომსახურების დეტალები</h3>

  //   <p>
  //     <strong>მომსახურება:</strong>
  //     ${appointment.subService}
  //   </p>

  //   <p>
  //     <strong>თარიღი:</strong>
  //     ${appointment.prefarenceDate?.[0]
  //       ? new Date(appointment.prefarenceDate[0] as any).toLocaleDateString()
  //       : "N/A"
  //     }
  //     ${appointment.prefarenceTime || ""}
  //   </p>

  //   <hr style="margin: 25px 0;" />

  //   <h3>ფინანსური ინფორმაცია</h3>

  //   <p>
  //     <strong>მომსახურების ღირებულება:</strong>
  //     ${roundMoney(appointment.appointmentFee - appointment.appointmentFee * 0.05)} ₾
  //   </p>

  //   <p>
  //     <strong>რაოდენობა:</strong>
  //     1
  //   </p>

  //   <p style="font-size: 18px;">
  //     <strong>ჯამი:</strong>
  //     ${roundMoney(appointment.appointmentFee - appointment.appointmentFee * 0.05)} ₾
  //   </p>

  //   <hr style="margin: 25px 0;" />

  //   <h3>გადახდის მეთოდი</h3>

  //   <p>
  //     ბარათით გადახდა
  //   </p>

  //   <hr style="margin: 25px 0;" />

  //   <h3>შენიშვნა</h3>

  //   <p style="line-height: 1.7;">
  //     აღნიშნული ქვითარი გაცემულია ექთნის მიერ გაწეული მომსახურებისთვის.
  //     MedConnect წარმოადგენს აგენტ პლატფორმას, რომელიც უზრუნველყოფს დაჯავშნას და
  //     გადახდას.
  //   </p>

  //   <hr style="margin: 25px 0;" />

  //   <h3>საკონტაქტო</h3>

  //   <p>
  //     თუ გაქვთ შეკითხვა ამ ქვითართან დაკავშირებით, დაგვიკავშირდით:
  //   </p>

  //   <p>
  //     main@medconnect.com.ge
  //   </p>

  // </div>
  // `;
  //   const patientReceit2 = `
  //   <div style="font-family: Arial, sans-serif; max-width: 700px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
      
  //     <h1 style="color: #0f766e; margin-bottom: 5px;">MedConnect</h1>

  //     <p style="margin: 2px 0;">
  //       <strong>კომპანიის დასახელება:</strong> შპს მედქონექთ ჯგუფი 2025
  //     </p>

  //     <p style="margin: 2px 0;">
  //       <strong>საიდენტიფიკაციო კოდი:</strong> 430049501
  //     </p>

  //     <p style="margin: 2px 0;">
  //       <strong>მისამართი:</strong> საქართველო, ზესტაფონის რაიონი, ს. შუა კვალითი, მე–19 I შეს., N 4
  //     </p>

  //     <hr style="margin: 20px 0;" />

  //     <h2 style="margin-bottom: 10px;">ქვითარი</h2>

  //     <p>
  //       <strong>დოკუმენტის ნომერი:</strong> MC-${payment._id}
  //     </p>

  //     <p>
  //       <strong>გაცემის თარიღი:</strong> ${new Date().toLocaleDateString()}
  //     </p>

  //     <p>
  //       <strong>შეკვეთის ID:</strong> ${payment._id}
  //     </p>

  //     <hr style="margin: 20px 0;" />

  //     <h3>მომხმარებელი</h3>

  //     <p>
  //       <strong>სახელი და გვარი:</strong> ${(appointment.patientId as any)?.userId?.fullName || "N/A"
  //     }
  //     </p>

  //     <hr style="margin: 20px 0;" />

  //     <h3>მომსახურების აღწერა</h3>

  //     <p>
  //       MedConnect პლატფორმის სერვისის საფასური
  //     </p>

  //     <hr style="margin: 20px 0;" />

  //     <h3>ფინანსური ინფორმაცია</h3>

  //     <p>
  //       <strong>სერვისის საფასური:</strong>
  //       ${roundMoney(appointment.appointmentFee * 0.05)} ₾
  //     </p>

  //     <p>
  //       <strong>მათ შორის დღგ (18%):</strong>
  //       ${roundMoney(((appointment.appointmentFee * 0.05) * .18))} ₾
  //     </p>

  //     <p style="font-size: 18px;">
  //       <strong>ჯამი:</strong>
  //       ${roundMoney(appointment.appointmentFee * 0.05)} ₾
  //     </p>

  //     <hr style="margin: 20px 0;" />

  //     <h3>გადახდის მეთოდი</h3>

  //     <p>ბარათით გადახდა</p>

  //     <hr style="margin: 20px 0;" />

  //     <h3>შენიშვნა</h3>

  //     <p>
  //       აღნიშნული თანხა წარმოადგენს MedConnect პლატფორმის გამოყენების საფასურს.
  //     </p>

  //     <hr style="margin: 20px 0;" />

  //     <h3>საკონტაქტო</h3>

  //     <p>
  //       main@medconnect.com.ge
  //     </p>

  //   </div>
  // `;

  //   if (bogOrder) {
  //     //send to patients 
  //     await sendEmail({
  //       to: patientEmail,
  //       subject: "MedConnect Nurse Service Receipt",
  //       html: patientReceit1,
  //     });
  //     await sendEmail({
  //       to: patientEmail,
  //       subject: "MedConnect Payment Receipt",
  //       html: patientReceit2,
  //     });

  //     // send to nurse
  //     await sendEmail({
  //       to: soloNurseEmail,
  //       subject: "MedConnect Commission Invoice",
  //       html: nurseReceiptHtml,
  //     });



  //     // send to giorgi accounting
  //     await sendEmail({
  //       to: accountingEmail,
  //       subject: `MedConnect Nurse Service Receipt`,
  //       html: patientReceit1,
  //     });

  //     await sendEmail({
  //       to: accountingEmail,
  //       subject: `MedConnect Payment Receipt`,
  //       html: patientReceit2,
  //     });

  //     await sendEmail({
  //       to: accountingEmail,
  //       subject: `Nurse Service Receipt `,
  //       html: nurseReceiptHtml,
  //     });

  //   }


    // res.json({ redirectUrl: bogOrder._links.redirect.href });
    return sendBoGPaymentResponse(res, bogOrder);

  } catch (error: any) {
    console.error("Error creating BoG order:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

// BoG webhook callback
const bogCallbackController = async (req: Request, res: Response) => {
  try {
    const result = await PaymentService.handleBoGCallbackService(req.body);

    const payment = await Payment_Model.findById(result.paymentId);
    let appointment;
    if (payment?.appointmentType === "SOLO_NURSE") {
      appointment = await soloNurseAppoinment_Model.findById(payment.appointmentId);
    }

    const patientEmail = (appointment?.patientId as any)?.userId?.email;
    const soloNurseEmail = (appointment?.soloNurseId as any)?.userId?.email;

    const roundMoney = (value: number) =>
      Math.round((value + Number.EPSILON) * 100) / 100;

    const commissionAmount = appointment?.appointmentFee ? roundMoney((appointment.appointmentFee - appointment.appointmentFee * 0.05) * 0.15) : 0;
    const nurseAmount = appointment?.appointmentFee ? roundMoney((appointment.appointmentFee - appointment.appointmentFee * 0.05) * 0.85) : 0;

    // giorgi's email 
    const accountingEmail = "accounting@medconnect.com.ge";

    const nurseReceiptHtml = `
  <div style="font-family: Arial, sans-serif; max-width: 750px; margin: auto; padding: 25px; border: 1px solid #e5e7eb; border-radius: 10px; color: #111827;">

    <h1 style="color: #0f766e; margin-bottom: 5px;">
      MedConnect
    </h1>

    <p style="margin: 3px 0;">
      <strong>კომპანიის დასახელება:</strong>
      შპს მედქონექთ ჯგუფი 2025
    </p>

    <p style="margin: 3px 0;">
      <strong>საიდენტიფიკაციო კოდი:</strong>
      430049501
    </p>

    <p style="margin: 3px 0;">
      <strong>მისამართი:</strong>
      საქართველო, ზესტაფონის რაიონი, ს. შუა კვალითი, მე–19 I შეს., N 4
    </p>

    <hr style="margin: 25px 0;" />

    <h2 style="margin-bottom: 15px;">
      საკომისიო ინვოისი
    </h2>

    <p>
      <strong>ინვოისის ნომერი:</strong>
      COMM-${payment?._id}
    </p>

    <p>
      <strong>გაცემის თარიღი:</strong>
      ${new Date().toLocaleDateString()}
    </p>

    <p>
      <strong>შეკვეთის ID:</strong>
      ${payment?._id}
    </p>

    <hr style="margin: 25px 0;" />

    <h3>მიმღები</h3>

    <p>
      <strong>სახელი და გვარი:</strong>
      ${(appointment?.soloNurseId as any)?.userId?.fullName || "N/A"}
    </p>

    <p>
      <strong>სტატუსი:</strong>
      ინდმეწარმე / მცირე მეწარმე
    </p>

    <p>
      <strong>საიდენტიფიკაციო ნომერი:</strong>
      ${(appointment?.soloNurseId as any)?.nationalIdNumber || "N/A"}
    </p>

    <hr style="margin: 25px 0;" />

    <h3>მომსახურების აღწერა</h3>

    <p>
      MedConnect პლატფორმის საკომისიო მომსახურება
    </p>

    <hr style="margin: 25px 0;" />

    <h3>ფინანსური ინფორმაცია</h3>

    <p>
      <strong>მომსახურების სრული ღირებულება:</strong>
      ${appointment?.appointmentFee ? roundMoney((appointment.appointmentFee - appointment.appointmentFee * 0.05)) : 0} ₾
    </p>

    <p>
      <strong>საკომისიო (15%):</strong>
      ${commissionAmount} ₾
    </p>
    <p>
      <strong>მათ შორის დღგ (18%):</strong>
      ${roundMoney(commissionAmount * 0.18)} ₾
    </p>

    

    <p style="font-size: 18px;">
      <strong>სულ:</strong>
      ${commissionAmount} ₾
    </p>

    <hr style="margin: 25px 0;" />

    <h3>ექთანზე ჩასარიცხი თანხა</h3>

    <p style="font-size: 18px;">
      <strong>${nurseAmount} ₾</strong>
    </p>

    <hr style="margin: 25px 0;" />

    <h3>გადახდის თარიღი</h3>

    <p>
      ${new Date().toLocaleDateString()}
    </p>

    <hr style="margin: 25px 0;" />

    <h3>შენიშვნა</h3>

    <p style="line-height: 1.7;">
      აღნიშნული ინვოისი ასახავს MedConnect-ის საკომისიოს მოცემულ შეკვეთაზე.
    </p>

    <hr style="margin: 25px 0;" />

    <h3>საკონტაქტო</h3>

    <p>
      main@medconnect.com.ge
    </p>

  </div>
  `;
    const patientReceit1 = `
  <div style="font-family: Arial, sans-serif; max-width: 750px; margin: auto; padding: 25px; border: 1px solid #e5e7eb; border-radius: 10px; color: #111827;">

    <h1 style="color: #0f766e; margin-bottom: 5px;">
      MedConnect
    </h1>

    <p style="margin: 3px 0;">
      <strong>კომპანიის დასახელება:</strong>
      შპს მედქონექთ ჯგუფი 2025
    </p>

    <p style="margin: 3px 0;">
      <strong>საიდენტიფიკაციო კოდი:</strong>
      430049501
    </p>

    <p style="margin: 3px 0;">
      <strong>მისამართი:</strong>
      საქართველო, ზესტაფონის რაიონი, ს. შუა კვალითი, მე–19 I შეს., N 4
    </p>

    <hr style="margin: 25px 0;" />

    <h2 style="margin-bottom: 15px;">
      მომსახურების ქვითარი
    </h2>

    <p>
      <strong>დოკუმენტის ნომერი:</strong>
      NUR-${payment?._id}
    </p>

    <p>
      <strong>გაცემის თარიღი:</strong>
      ${new Date().toLocaleDateString()}
    </p>

    <p>
      <strong>შეკვეთის ID:</strong>
      ${payment?._id}
    </p>

    <hr style="margin: 25px 0;" />

    <h3>მომსახურების გამწევი</h3>

    <p>
      <strong>სახელი და გვარი:</strong>
      ${(appointment?.soloNurseId as any)?.userId?.fullName || "N/A"}
    </p>

    <p>
      <strong>სტატუსი:</strong>
      ინდმეწარმე / მცირე მეწარმე
    </p>

    <p>
      <strong>საიდენტიფიკაციო ნომერი:</strong>
      ${(appointment?.soloNurseId as any)?.nationalIdNumber || "N/A"}
    </p>

    <hr style="margin: 25px 0;" />

    <h3>პაციენტი</h3>

    <p>
      <strong>სახელი და გვარი:</strong>
      ${(appointment?.patientId as any)?.userId?.fullName || "N/A"}
    </p>

    <hr style="margin: 25px 0;" />

    <h3>მომსახურების დეტალები</h3>

    <p>
      <strong>მომსახურება:</strong>
      ${appointment?.subService}
    </p>

    <p>
      <strong>თარიღი:</strong>
      ${appointment?.prefarenceDate?.[0]
        ? new Date(appointment.prefarenceDate[0] as any).toLocaleDateString()
        : "N/A"
      }
      ${appointment?.prefarenceTime || ""}
    </p>

    <hr style="margin: 25px 0;" />

    <h3>ფინანსური ინფორმაცია</h3>

    <p>
      <strong>მომსახურების ღირებულება:</strong>
      ${appointment?.appointmentFee ? roundMoney((appointment.appointmentFee - appointment.appointmentFee * 0.05)) : 0} ₾
    </p>

    <p>
      <strong>რაოდენობა:</strong>
      1
    </p>

    <p style="font-size: 18px;">
      <strong>ჯამი:</strong>
      ${appointment?.appointmentFee ? roundMoney((appointment.appointmentFee - appointment.appointmentFee * 0.05)) : 0} ₾
    </p>

    <hr style="margin: 25px 0;" />

    <h3>გადახდის მეთოდი</h3>

    <p>
      ბარათით გადახდა
    </p>

    <hr style="margin: 25px 0;" />

    <h3>შენიშვნა</h3>

    <p style="line-height: 1.7;">
      აღნიშნული ქვითარი გაცემულია ექთნის მიერ გაწეული მომსახურებისთვის.
      MedConnect წარმოადგენს აგენტ პლატფორმას, რომელიც უზრუნველყოფს დაჯავშნას და
      გადახდას.
    </p>

    <hr style="margin: 25px 0;" />

    <h3>საკონტაქტო</h3>

    <p>
      თუ გაქვთ შეკითხვა ამ ქვითართან დაკავშირებით, დაგვიკავშირდით:
    </p>

    <p>
      main@medconnect.com.ge
    </p>

  </div>
  `;
    const patientReceit2 = `
    <div style="font-family: Arial, sans-serif; max-width: 700px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
      
      <h1 style="color: #0f766e; margin-bottom: 5px;">MedConnect</h1>

      <p style="margin: 2px 0;">
        <strong>კომპანიის დასახელება:</strong> შპს მედქონექთ ჯგუფი 2025
      </p>

      <p style="margin: 2px 0;">
        <strong>საიდენტიფიკაციო კოდი:</strong> 430049501
      </p>

      <p style="margin: 2px 0;">
        <strong>მისამართი:</strong> საქართველო, ზესტაფონის რაიონი, ს. შუა კვალითი, მე–19 I შეს., N 4
      </p>

      <hr style="margin: 20px 0;" />

      <h2 style="margin-bottom: 10px;">ქვითარი</h2>

      <p>
        <strong>დოკუმენტის ნომერი:</strong> MC-${payment?._id}
      </p>

      <p>
        <strong>გაცემის თარიღი:</strong> ${new Date().toLocaleDateString()}
      </p>

      <p>
        <strong>შეკვეთის ID:</strong> ${payment?._id}
      </p>

      <hr style="margin: 20px 0;" />

      <h3>მომხმარებელი</h3>

      <p>
        <strong>სახელი და გვარი:</strong> ${(appointment?.patientId as any)?.userId?.fullName || "N/A"
      }
      </p>

      <hr style="margin: 20px 0;" />

      <h3>მომსახურების აღწერა</h3>

      <p>
        MedConnect პლატფორმის სერვისის საფასური
      </p>

      <hr style="margin: 20px 0;" />

      <h3>ფინანსური ინფორმაცია</h3>

      <p>
        <strong>სერვისის საფასური:</strong>
        ${appointment?.appointmentFee ? roundMoney((appointment.appointmentFee * 0.05)) : 0} ₾
      </p>

      <p>
        <strong>მათ შორის დღგ (18%):</strong>
        ${appointment?.appointmentFee ? roundMoney(((appointment.appointmentFee * 0.05) * .18)) : 0} ₾
      </p>

      <p style="font-size: 18px;">
        <strong>ჯამი:</strong>
        ${appointment?.appointmentFee ? roundMoney((appointment.appointmentFee * 0.05)) : 0} ₾
      </p>

      <hr style="margin: 20px 0;" />

      <h3>გადახდის მეთოდი</h3>

      <p>ბარათით გადახდა</p>

      <hr style="margin: 20px 0;" />

      <h3>შენიშვნა</h3>

      <p>
        აღნიშნული თანხა წარმოადგენს MedConnect პლატფორმის გამოყენების საფასურს.
      </p>

      <hr style="margin: 20px 0;" />

      <h3>საკონტაქტო</h3>

      <p>
        main@medconnect.com.ge
      </p>

    </div>
  `;


      //send to patients 
      await sendEmail({
        to: patientEmail,
        subject: "MedConnect Nurse Service Receipt",
        html: patientReceit1,
      });
      await sendEmail({
        to: patientEmail,
        subject: "MedConnect Payment Receipt",
        html: patientReceit2,
      });

      // send to nurse
      await sendEmail({
        to: soloNurseEmail,
        subject: "MedConnect Commission Invoice",
        html: nurseReceiptHtml,
      });



      // send to giorgi accounting
      await sendEmail({
        to: accountingEmail,
        subject: `MedConnect Nurse Service Receipt`,
        html: patientReceit1,
      });

      await sendEmail({
        to: accountingEmail,
        subject: `MedConnect Payment Receipt`,
        html: patientReceit2,
      });

      await sendEmail({
        to: accountingEmail,
        subject: `Nurse Service Receipt `,
        html: nurseReceiptHtml,
      });

    


    res.json({ success: true, message: "Callback processed" });
  } catch (error: any) {
    console.error("BoG Callback Error:", error.message);
    res.sendStatus(200); // Always return 200 to prevent webhook retries
  }
};

// Payment success page
// const paymentSuccess = async (req: Request, res: Response) => {
//   const { paymentId } = req.query;
//   if (!paymentId) return res.status(400).send("Invalid payment request");

//   const payment = await Payment_Model.findById(paymentId as string);
//   if (!payment) return res.status(404).send("Payment not found");

//   res.send(`
//     <h2>✅ Payment Successful</h2>
//     <p>Your payment is being processed.</p>
//     <p>Reference ID: ${paymentId}</p>
//   `);
// };

const paymentSuccess = async (req: Request, res: Response) => {
  const { paymentId } = req.query;

  if (!paymentId) {
    return res.status(400).send("Invalid payment request");
  }

  const payment = await Payment_Model.findById(paymentId as string);

  if (!payment) {
    return res.status(404).send("Payment not found");
  }

  // Change this to your frontend dashboard URL
  const dashboardUrl = "https://famous-brigadeiros-c58211.netlify.app/dashboard";

  res.send(`
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Payment Successful</title>

        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
            font-family: Arial, Helvetica, sans-serif;
          }

          body {
            height: 100vh;
            display: flex;
            justify-content: center;
            align-items: center;
            background: #f5f7fb;
          }

          .card {
            background: #fff;
            padding: 40px;
            border-radius: 16px;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08);
            text-align: center;
            max-width: 450px;
            width: 90%;
          }

          .icon {
            font-size: 60px;
            margin-bottom: 20px;
          }

          h2 {
            color: #16a34a;
            margin-bottom: 12px;
          }

          p {
            color: #555;
            margin-bottom: 10px;
            line-height: 1.5;
          }

          .reference {
            font-weight: bold;
            color: #111827;
            margin: 20px 0;
            word-break: break-all;
          }

          .btn {
            display: inline-block;
            margin-top: 15px;
            padding: 12px 24px;
            background: #2563eb;
            color: white;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 600;
            transition: background 0.2s ease;
          }

          .btn:hover {
            background: #1d4ed8;
          }
        </style>
      </head>

      <body>
        <div class="card">
          <div class="icon">✅</div>

          <h2>Payment Successful</h2>

          <p>Your payment has been received successfully.</p>
          <p>We're processing your transaction.</p>

          <p class="reference">
            Reference ID:<br />
            ${paymentId}
          </p>

          <a href="${dashboardUrl}" class="btn">
            Back to Dashboard
          </a>
        </div>
      </body>
    </html>
  `);
};


// Payment failed page
// const paymentFail = async (req: Request, res: Response) => {
//   const { paymentId } = req.query;
//   if (!paymentId) return res.status(400).send("Invalid payment request");

//   const payment = await Payment_Model.findById(paymentId as string);
//   if (!payment) return res.status(404).send("Payment not found");

//   res.send(`
//     <h2>❌ Payment Failed</h2>
//     <p>Your payment was not completed.</p>
//     <p>Reference ID: ${paymentId}</p>
//   `);
// };

const paymentFail = async (req: Request, res: Response) => {
  const { paymentId } = req.query;

  if (!paymentId) {
    return res.status(400).send("Invalid payment request");
  }

  const payment = await Payment_Model.findById(paymentId as string);

  if (!payment) {
    return res.status(404).send("Payment not found");
  }

  // Change this to your frontend dashboard URL
  const dashboardUrl = "https://famous-brigadeiros-c58211.netlify.app/dashboard";

  res.send(`
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Payment Failed</title>

        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
            font-family: Arial, Helvetica, sans-serif;
          }

          body {
            height: 100vh;
            display: flex;
            justify-content: center;
            align-items: center;
            background: #f5f7fb;
          }

          .card {
            background: #fff;
            padding: 40px;
            border-radius: 16px;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08);
            text-align: center;
            max-width: 450px;
            width: 90%;
          }

          .icon {
            font-size: 60px;
            margin-bottom: 20px;
          }

          h2 {
            color: #dc2626;
            margin-bottom: 12px;
          }

          p {
            color: #555;
            margin-bottom: 10px;
            line-height: 1.5;
          }

          .reference {
            font-weight: bold;
            color: #111827;
            margin: 20px 0;
            word-break: break-all;
          }

          .btn {
            display: inline-block;
            margin-top: 15px;
            padding: 12px 24px;
            background: #2563eb;
            color: white;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 600;
            transition: background 0.2s ease;
          }

          .btn:hover {
            background: #1d4ed8;
          }
        </style>
      </head>

      <body>
        <div class="card">
          <div class="icon">❌</div>

          <h2>Payment Failed</h2>

          <p>Unfortunately, your payment could not be completed.</p>
          <p>Please try again or contact support if the problem persists.</p>

          <p class="reference">
            Reference ID:<br />
            ${paymentId}
          </p>

          <a href="${dashboardUrl}" class="btn">
            Back to Dashboard
          </a>
        </div>
      </body>
    </html>
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
