#import "DatePickerModule.h"

#import <UIKit/UIKit.h>
#import <React/RCTUtils.h>

using namespace facebook::react;

typedef void (^RNDatePickerCompletion)(NSDate *_Nullable selectedDate, BOOL cancelled);

#pragma mark - Presenter view controller

@interface RNDatePickerViewController : UIViewController
@property (nonatomic, copy, nullable) RNDatePickerCompletion completion;
@property (nonatomic, strong) UIDatePicker *datePicker;
- (instancetype)initWithMode:(UIDatePickerMode)mode
                        style:(UIDatePickerStyle)style
                        value:(NSDate *)value
                  minimumDate:(nullable NSDate *)minimumDate
                  maximumDate:(nullable NSDate *)maximumDate;
@end

@implementation RNDatePickerViewController

- (instancetype)initWithMode:(UIDatePickerMode)mode
                        style:(UIDatePickerStyle)style
                        value:(NSDate *)value
                  minimumDate:(nullable NSDate *)minimumDate
                  maximumDate:(nullable NSDate *)maximumDate
{
  if (self = [super init]) {
    _datePicker = [UIDatePicker new];
    _datePicker.datePickerMode = mode;
    if (@available(iOS 13.4, *)) {
      _datePicker.preferredDatePickerStyle = style;
    }
    _datePicker.date = value;
    if (minimumDate) {
      _datePicker.minimumDate = minimumDate;
    }
    if (maximumDate) {
      _datePicker.maximumDate = maximumDate;
    }
  }
  return self;
}

- (void)viewDidLoad
{
  [super viewDidLoad];
  self.view.backgroundColor = UIColor.systemBackgroundColor;

  self.navigationItem.leftBarButtonItem =
      [[UIBarButtonItem alloc] initWithBarButtonSystemItem:UIBarButtonSystemItemCancel
                                                      target:self
                                                      action:@selector(onCancel)];
  self.navigationItem.rightBarButtonItem =
      [[UIBarButtonItem alloc] initWithBarButtonSystemItem:UIBarButtonSystemItemDone
                                                      target:self
                                                      action:@selector(onDone)];

  _datePicker.translatesAutoresizingMaskIntoConstraints = NO;
  [self.view addSubview:_datePicker];

  [NSLayoutConstraint activateConstraints:@[
    [_datePicker.centerYAnchor constraintEqualToAnchor:self.view.safeAreaLayoutGuide.centerYAnchor],
    [_datePicker.leadingAnchor constraintEqualToAnchor:self.view.leadingAnchor constant:16],
    [_datePicker.trailingAnchor constraintEqualToAnchor:self.view.trailingAnchor constant:-16],
  ]];
}

- (void)onCancel
{
  [self finishWithDate:nil cancelled:YES];
}

- (void)onDone
{
  [self finishWithDate:_datePicker.date cancelled:NO];
}

- (void)finishWithDate:(nullable NSDate *)date cancelled:(BOOL)cancelled
{
  RNDatePickerCompletion completion = self.completion;
  self.completion = nil;
  [self dismissViewControllerAnimated:YES completion:^{
    if (completion) {
      completion(date, cancelled);
    }
  }];
}

@end

#pragma mark - DatePickerModule

@interface DatePickerModule ()
@property (nonatomic, assign) BOOL isPickerPresented;
@property (nonatomic, weak) RNDatePickerViewController *activePicker;
@end

@implementation DatePickerModule

RCT_EXPORT_MODULE(DatePicker)

+ (BOOL)requiresMainQueueSetup
{
  return YES;
}

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
    (const facebook::react::ObjCTurboModule::InitParams &)params
{
  return std::make_shared<facebook::react::NativeDatePickerSpecJSI>(params);
}

- (void)invalidate
{
  [self.activePicker dismissViewControllerAnimated:NO completion:nil];
}

- (void)open:(JS::NativeDatePicker::DatePickerOptions &)options
     resolve:(RCTPromiseResolveBlock)resolve
      reject:(RCTPromiseRejectBlock)reject
{
  NSString *modeString = options.mode();
  NSString *displayString = options.display();
  std::optional<double> value = options.value();
  std::optional<double> minimumDate = options.minimumDate();
  std::optional<double> maximumDate = options.maximumDate();

  dispatch_async(dispatch_get_main_queue(), ^{
    [self presentPickerWithMode:modeString
                         display:displayString
                           value:value
                     minimumDate:minimumDate
                     maximumDate:maximumDate
                         resolve:resolve
                          reject:reject];
  });
}

- (void)presentPickerWithMode:(NSString *)modeString
                       display:(nullable NSString *)displayString
                         value:(std::optional<double>)value
                   minimumDate:(std::optional<double>)minimumDate
                   maximumDate:(std::optional<double>)maximumDate
                       resolve:(RCTPromiseResolveBlock)resolve
                        reject:(RCTPromiseRejectBlock)reject
{
  if (self.isPickerPresented) {
    reject(@"E_DATE_PICKER_BUSY", @"A date picker is already being presented.", nil);
    return;
  }

  UIViewController *presenter = RCTPresentedViewController();
  if (!presenter) {
    reject(@"E_NO_VIEW_CONTROLLER", @"Unable to find a view controller to present the date picker from.", nil);
    return;
  }

  UIDatePickerMode mode = UIDatePickerModeDate;
  if ([modeString isEqualToString:@"time"]) {
    mode = UIDatePickerModeTime;
  } else if ([modeString isEqualToString:@"datetime"]) {
    mode = UIDatePickerModeDateAndTime;
  } else if (![modeString isEqualToString:@"date"]) {
    reject(@"E_INVALID_MODE", [NSString stringWithFormat:@"Unsupported date picker mode: %@", modeString], nil);
    return;
  }

  UIDatePickerStyle style = UIDatePickerStyleWheels;
  if ([displayString isEqualToString:@"calendar"]) {
    style = UIDatePickerStyleInline;
  } else if ([displayString isEqualToString:@"default"]) {
    style = UIDatePickerStyleAutomatic;
  }
  // "spinner" and "clock" (Android-only concepts) fall back to Wheels, the
  // closest iOS equivalent.

  NSDate *initialValue = value.has_value()
      ? [NSDate dateWithTimeIntervalSince1970:*value / 1000.0]
      : [NSDate date];
  NSDate *minDate = minimumDate.has_value() ? [NSDate dateWithTimeIntervalSince1970:*minimumDate / 1000.0] : nil;
  NSDate *maxDate = maximumDate.has_value() ? [NSDate dateWithTimeIntervalSince1970:*maximumDate / 1000.0] : nil;

  RNDatePickerViewController *pickerVC =
      [[RNDatePickerViewController alloc] initWithMode:mode
                                                  style:style
                                                  value:initialValue
                                            minimumDate:minDate
                                            maximumDate:maxDate];

  __weak DatePickerModule *weakSelf = self;
  pickerVC.completion = ^(NSDate *_Nullable selectedDate, BOOL cancelled) {
    weakSelf.isPickerPresented = NO;
    weakSelf.activePicker = nil;
    NSDate *resultDate = selectedDate ?: initialValue;
    resolve(@{
      @"value" : @(resultDate.timeIntervalSince1970 * 1000.0),
      @"cancelled" : @(cancelled),
    });
  };

  UINavigationController *nav = [[UINavigationController alloc] initWithRootViewController:pickerVC];
  if (@available(iOS 15.0, *)) {
    nav.modalPresentationStyle = UIModalPresentationPageSheet;
    nav.sheetPresentationController.detents = @[UISheetPresentationControllerDetent.mediumDetent];
  } else {
    nav.modalPresentationStyle = UIModalPresentationFormSheet;
  }

  self.isPickerPresented = YES;
  self.activePicker = pickerVC;
  [presenter presentViewController:nav animated:YES completion:nil];
}

@end
